import AllInOneSDKManager from 'paytmpayments-allinone-react-native';
import { PAYTM_CONFIG } from '../../config/apiConfig';

export interface PaytmStartTransactionParams {
  orderId: string | number;
  mid?: string;
  txnToken: string;
  amount: string | number;
  callbackUrl?: string;
  isStaging?: boolean;
  restrictAppInvoke?: boolean;
  urlScheme?: string;
}

export interface PaytmTransactionResult {
  BANKNAME?: string;
  BANKTXNID?: string;
  CHECKSUMHASH?: string;
  CURRENCY?: string;
  GATEWAYNAME?: string;
  MID?: string;
  ORDERID?: string;
  PAYMENTMODE?: string;
  RESPCODE?: string;
  RESPMSG?: string;
  STATUS?: 'TXN_SUCCESS' | 'TXN_FAILURE' | 'PENDING' | string;
  TXNAMOUNT?: string;
  TXNDATE?: string;
  TXNID?: string;
  [key: string]: any;
}

/**
 * Main Paytm All-In-One SDK Transaction Handler
 * Managed in a separate service module
 */
export const startPaytmTransaction = async (
  params: PaytmStartTransactionParams,
): Promise<PaytmTransactionResult> => {
  const {
    orderId,
    mid = PAYTM_CONFIG.MID,
    txnToken,
    amount,
    callbackUrl,
    isStaging = PAYTM_CONFIG.IS_STAGING,
    restrictAppInvoke = PAYTM_CONFIG.RESTRICT_APP_INVOKE,
    urlScheme = PAYTM_CONFIG.URL_SCHEME,
  } = params;

  const formattedOrderId = String(orderId);
  const formattedMid = String(mid);
  const formattedTxnToken = String(txnToken);
  const formattedAmount =
    typeof amount === 'number' ? amount.toFixed(2) : String(amount);

  const finalCallbackUrl =
    callbackUrl ||
    `http://115.187.62.16:8005/PujaConnectRestAPI/api/citizen/update_payment_status_v1_mobile`;

  const finalUrlScheme = urlScheme || `paytm${formattedMid}`;

  console.log('====================================================');
  console.log('🚀 [PAYTM SDK MANAGER] Initiating startTransaction:');
  console.log({
    orderId: formattedOrderId,
    mid: formattedMid,
    txnToken: formattedTxnToken,
    amount: formattedAmount,
    callbackUrl: finalCallbackUrl,
    isStaging,
    restrictAppInvoke,
    urlScheme: finalUrlScheme,
  });
  console.log('====================================================');

  try {
    const result = await AllInOneSDKManager.startTransaction(
      formattedOrderId,
      formattedMid,
      formattedTxnToken,
      formattedAmount,
      finalCallbackUrl,
      isStaging,
      restrictAppInvoke,
      finalUrlScheme,
    );

    console.log('====================================================');
    console.log('✅ [PAYTM SDK SUCCESS RESPONSE]:');
    console.log(JSON.stringify(result, null, 2));
    console.log('====================================================');

    return result;
  } catch (error: any) {
    console.log('====================================================');
    console.error('❌ [PAYTM SDK ERROR / CANCELLED RESPONSE]:');
    console.log(typeof error === 'object' ? JSON.stringify(error, null, 2) : error);
    console.log('====================================================');

    throw error;
  }
};
