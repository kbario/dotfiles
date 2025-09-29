/* @refresh reload */
import {
  ArrowRightLeft,
  ArrowUpDown,
  Battery as BatterIcon,
  BatteryCharging,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  BatteryWarning,
  Cloud,
  Cpu,
  Microchip,
  Wifi,
  WifiHigh,
  WifiLow,
  WifiOff,
  WifiZero,
} from "lucide-solid";
import {
  ComponentProps,
  createMemo,
  Match,
  ParentProps,
  splitProps,
  Switch,
} from "solid-js";
import { createStore } from "solid-js/store";
import { For, render, Show } from "solid-js/web";
import * as zebar from "zebar";
import "./index.css";
import { cn } from "./utils";

const ERROR_LIMIT = 90;
const WARNING_LIMIT = 70;
const GIGABYTES = 1000 * 1000 * 1000;

const acceptableIcons = ["zebar", "glaze", "globalprotect"];

const providers = zebar.createProviderGroup({
  glazewm: { type: "glazewm" },
  date: { type: "date", formatting: "EEE d MMM t" },
  audio: { type: "audio" },
  cpu: { type: "cpu" },
  battery: { type: "battery" },
  memory: { type: "memory" },
  weather: { type: "weather" },
  media: { type: "media" },
  systray: { type: "systray" },
  network: { type: "network" },
});

type ButtonProps = ParentProps & Partial<ComponentProps<"button">>;
const Button = (props: ButtonProps) => {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <button
      class={cn(
        "cursor-pointer [&_svg]:size-(--icon-size) px-(--padding-x) py-(--padding-y)  bg-slate-800 data-[displayed='true']:data-[active='false']:bg-slate-700 hover:bg-slate-600 data-[active='true']:bg-indigo-800 data-[active='true']:hover:bg-indigo-600 rounded-sm",
        local.class,
      )}
      {...rest}
    >
      {props.children}
    </button>
  );
};

const StatContainer = (props: ParentProps & ComponentProps<"button">) => {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <button
      class={cn(
        "flex gap-1 items-center [&_svg]:size-(--icon-size) rounded-sm px-(--padding-x) py-(--padding-y) disabled:text-slate-400 disabled:px-(--padding-y)",
        "data-[warning='true']:bg-yellow-800",
        "data-[error='true']:bg-red-800",
        rest.onClick ? "cursor-pointer" : "cursor-default",
        local.class,
      )}
      {...rest}
    />
  );
};

const SignalStrength = (props: { signalStrength: number }) => {
  return (
    <Switch>
      <Match when={props.signalStrength > 80}>
        <Wifi />
      </Match>
      <Match when={props.signalStrength > 50}>
        <WifiHigh />
      </Match>
      <Match when={props.signalStrength > 25}>
        <WifiLow />
      </Match>
      <Match when={props.signalStrength > 10}>
        <WifiZero />
      </Match>
    </Switch>
  );
};

const Battery = (props: { battery: zebar.BatteryOutput }) => {
  return (
    <Switch>
      <Match when={props.battery.healthPercent < 25}>
        <BatteryWarning />
      </Match>
      <Match when={props.battery.isCharging}>
        <BatteryCharging />
      </Match>
      <Match when={props.battery.chargePercent > 80}>
        <BatteryFull />
      </Match>
      <Match when={props.battery.chargePercent > 50}>
        <BatteryMedium />
      </Match>
      <Match when={props.battery.chargePercent > 25}>
        <BatteryLow />
      </Match>
      <Match when={props.battery.chargePercent > 10}>
        <BatterIcon />
      </Match>
      <Match when={props.battery.chargePercent}>
        <BatteryFull />
      </Match>
    </Switch>
  );
};

const detailsReducer = (acc, [key, value], i) => {
  const [k, suffix] = key.split(":");
  if (key && value)
    acc += `${i ? "\n" : ""}${k}: ${Math.round(value)}${
      suffix ? `${suffix}` : ""
    }`;
  return acc;
};

function App() {
  const [output, setOutput] = createStore(providers.outputMap);

  providers.onOutput((outputMap) => setOutput(outputMap));

  const batteryStats = createMemo(() => {
    if (!output?.battery) return;
    const x = {
      ["Health:%"]: output.battery.healthPercent,
      ["Power Use"]: output.battery.powerConsumption,
      Voltage: output.battery.voltage,
    };
    return Object.entries(
      (function () {
        if (output.battery.isCharging) {
          return {
            ...x,
            ["Time til Full"]: output.battery.timeTillFull,
          };
        } else {
          return {
            ...x,
            ["Time til Empty"]: output.battery.timeTillEmpty,
          };
        }
      })(),
    ).reduce(detailsReducer, "");
  });
  const cpuStats = createMemo(() => {
    if (!output?.cpu) return;
    const x = {
      ["frequency:Hz"]: output.cpu.frequency,
      ["Logical Cores"]: output.cpu.logicalCoreCount,
      ["Physical Cores"]: output.cpu.physicalCoreCount,
      ["Vendor"]: output.cpu.vendor,
    };
    return Object.entries(x).reduce(detailsReducer, "");
  });
  const systray = createMemo(() =>
    output?.systray?.icons
      .filter((icon) =>
        acceptableIcons.some((i) => icon.tooltip.toLowerCase().includes(i)),
      )
      .sort((a, b) => {
        const aIndex = acceptableIcons.findIndex((acceptable) =>
          a.tooltip.toLowerCase().includes(acceptable),
        );
        const bIndex = acceptableIcons.findIndex((acceptable) =>
          b.tooltip.toLowerCase().includes(acceptable),
        );
        return aIndex - bIndex;
      }),
  );

  return (
    <div class="[--icon-size:1rem] [--padding-y:0.25rem] [--padding-x:0.5rem] px-4 text-xs grid grid-cols-[1fr_auto_1fr] w-full items-center h-full bg-slate-900/80 text-slate-50">
      <div id={"left"} class="flex items-center justify-start gap-2">
        <Show when={output?.glazewm?.tilingDirection}>
          <Button
            onClick={() => output.glazewm.runCommand("toggle-tiling-direction")}
          >
            {output.glazewm.tilingDirection === "horizontal" ? (
              <ArrowRightLeft />
            ) : (
              <ArrowUpDown />
            )}
          </Button>
        </Show>
        <Show
          when={
            output?.glazewm?.allMonitors?.length &&
            output?.glazewm?.currentMonitor
          }
        >
          <Button
            class="cursor-default"
            data-active={output?.glazewm?.currentMonitor.hasFocus}
          >
            {output?.glazewm?.allMonitors.findIndex(
              (monitor) => monitor.id === output?.glazewm?.currentMonitor?.id,
            )}
          </Button>
        </Show>
        <Show when={output?.glazewm?.currentWorkspaces?.length}>
          <For each={output.glazewm.currentWorkspaces}>
            {(workspace) => (
              <Button
                data-active={workspace.hasFocus}
                data-displayed={workspace.isDisplayed}
                onClick={() =>
                  output.glazewm.runCommand(
                    `focus --workspace ${workspace.name}`,
                  )
                }
              >
                {workspace.displayName ?? workspace.name}
              </Button>
            )}
          </For>
        </Show>
      </div>
      <div id={"center"} class="text-xs flex items-center justify-center gap-2">
        {output.date?.formatted}
      </div>
      <div id={"right"} class="flex items-center justify-end gap-3">
        {/* <Show when={output.audio?.defaultPlaybackDevice}>
          <div class="chip">
            {output.audio.defaultPlaybackDevice.name}-
            {output.audio.defaultPlaybackDevice.volume}
            <input
              type="range"
              min="0"
              max="100"
              step="2"
              value={output.audio.defaultPlaybackDevice.volume}
              onChange={(e) => output.audio.setVolume(e.target.valueAsNumber)}
            />
          </div>
        </Show> */}
        <Show when={output?.glazewm}>
          <Show when={output?.glazewm?.isPaused}>
            <button
              class="paused-button"
              onClick={() => output.glazewm.runCommand("wm-toggle-pause")}
            >
              PAUSED
            </button>
          </Show>
          <Show when={output?.glazewm?.bindingModes}>
            <For each={output?.glazewm?.bindingModes}>
              {(bindingMode) => (
                <button
                  class="binding-mode"
                  onClick={() =>
                    output.glazewm.runCommand(
                      `wm-disable-binding-mode --name ${bindingMode.name}`,
                    )
                  }
                >
                  {bindingMode.displayName ?? bindingMode.name}
                </button>
              )}
            </For>
          </Show>

          <button
            class={`tiling-direction nf ${
              output.glazewm.tilingDirection === "horizontal"
                ? "nf-md-swap_horizontal"
                : "nf-md-swap_vertical"
            }`}
            onClick={() => output.glazewm.runCommand("toggle-tiling-direction")}
          ></button>
        </Show>
        <div class="flex items-center gap-1">
          <Show
            when={output.network}
            fallback={
              <StatContainer disabled>
                <WifiOff />
              </StatContainer>
            }
          >
            <StatContainer
              data-warning={
                output.network.defaultGateway.signalStrength <
                100 - WARNING_LIMIT
              }
              data-error={
                output.network.defaultGateway.signalStrength < 100 - ERROR_LIMIT
              }
              title={`Strength: ${output.network.defaultGateway.signalStrength}%`}
            >
              <SignalStrength
                signalStrength={output.network.defaultGateway.signalStrength}
              />
              {output.network.defaultGateway?.ssid}
            </StatContainer>
          </Show>

          <Show
            when={output.memory}
            fallback={
              <StatContainer disabled>
                <Microchip />
              </StatContainer>
            }
          >
            <StatContainer
              data-warning={output.memory.usage > WARNING_LIMIT}
              data-error={output.memory.usage > ERROR_LIMIT}
              title={`${Math.round(
                output.memory.freeMemory / GIGABYTES,
              )} / ${Math.round(output.memory.totalMemory / GIGABYTES)}GB`}
            >
              <Microchip />
              {Math.round(output.memory.usage)}%
            </StatContainer>
          </Show>

          <Show
            when={output.cpu}
            fallback={
              <StatContainer disabled>
                <Cpu />
              </StatContainer>
            }
          >
            <StatContainer
              data-warning={output.cpu.usage > WARNING_LIMIT}
              data-error={output.cpu.usage > ERROR_LIMIT}
              title={cpuStats()}
            >
              <Cpu />
              {Math.round(output.cpu.usage)}%
            </StatContainer>
          </Show>

          <Show
            when={output.battery}
            fallback={
              <StatContainer disabled>
                <BatteryWarning />
              </StatContainer>
            }
          >
            <StatContainer
              data-warning={
                output.battery.chargePercent < 100 - WARNING_LIMIT ||
                output.battery.healthPercent < 100 - WARNING_LIMIT
              }
              data-error={
                output.battery.chargePercent < 100 - ERROR_LIMIT ||
                output.battery.healthPercent < 100 - ERROR_LIMIT
              }
              title={batteryStats()}
            >
              <Battery battery={output.battery} />
              {Math.round(output.battery.chargePercent)}%
            </StatContainer>
          </Show>

          <Show
            when={output.weather}
            fallback={
              <StatContainer disabled>
                <Cloud />
              </StatContainer>
            }
          >
            <StatContainer
              data-warning={output.cpu.usage > WARNING_LIMIT}
              data-error={output.cpu.usage > ERROR_LIMIT}
              title={cpuStats()}
            >
              <Cloud />
              {Math.round(output.weather.celsiusTemp)}°C
            </StatContainer>
          </Show>
        </div>

        <Show when={output.systray}>
          <div class="flex gap-1">
            <For each={systray()}>
              {(icon) => {
                const tooltip = icon.tooltip.toLowerCase();
                return (
                  <StatContainer
                    class="p-(--padding-y)"
                    data-error={
                      tooltip.includes("globalprotect") &&
                      tooltip.includes("disconnected")
                    }
                  >
                    <img
                      class="size-4"
                      src={icon.iconUrl}
                      title={icon.tooltip}
                      onClick={(e) => {
                        e.preventDefault();
                        output.systray.onLeftClick(icon.id);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        output.systray.onRightClick(icon.id);
                      }}
                    />
                  </StatContainer>
                );
              }}
            </For>
          </div>
        </Show>
      </div>

      {/* {output.media?.currentSession && (
        <div class="chip">
          Media: {output.media.currentSession.title}-
          {output.media.currentSession.artist}
          <button onClick={() => output.media?.togglePlayPause()}>⏯</button>
        </div>
      )} */}
    </div>
  );
}

render(() => <App />, document.getElementById("root")!);
