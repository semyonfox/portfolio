import {
  createTelemetry,
  type CountName,
  type ErrorName,
  type Route,
} from './telemetry';

const telemetry = createTelemetry(
  import.meta.env.PUBLIC_TELEMETRY_ENABLED === 'true',
  import.meta.env.PUBLIC_TELEMETRY_ENDPOINT,
);

export function currentRoute(): Route {
  const value = document.body.dataset.telemetryRoute;
  return value === 'home' ||
    value === 'help' ||
    value === 'game' ||
    value === 'library'
    ? value
    : 'app';
}

export function track(name: CountName, route = currentRoute()) {
  telemetry.count(name, route);
}

export function trackError(name: ErrorName, route = currentRoute()) {
  telemetry.error(name, route);
}

export const setTelemetryDisabled = (value: boolean) =>
  telemetry.setDisabled(value);
export const telemetryDisabled = () => telemetry.isDisabled();
