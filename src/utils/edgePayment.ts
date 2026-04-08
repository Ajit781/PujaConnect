import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'edge' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const EdgeModule = NativeModules.EdgeModule
  ? NativeModules.EdgeModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      },
    );

// Destructure the startPayment method from the Edge module
const { startPayment } = EdgeModule;

export interface paymentParams {
  options: {
    redirectUrl: string;
  };
}

export const startPayment_ = (
  params: paymentParams,
  callback: CallableFunction,
): void => {
  console.log('[Edge SDK] startPayment_ invoked with options:', params.options);
  startPayment(params.options.redirectUrl, (response: any) => {
    console.log('[Edge SDK Native Callback] Response received:', response);
    if (callback) {
      callback(response);
    }
  });
};

export default { startPayment_ };
