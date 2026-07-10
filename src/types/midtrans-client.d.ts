declare module "midtrans-client" {
  type MidtransConfig = {
    isProduction: boolean
    serverKey?: string
    clientKey?: string
  }

  export class CoreApi {
    constructor(config: MidtransConfig)
    charge(parameter: Record<string, unknown>): Promise<Record<string, unknown>>
    transaction: {
      notification(payload: Record<string, unknown>): Promise<Record<string, unknown>>
    }
  }

  export class Snap {
    constructor(config: MidtransConfig)
    createTransaction(parameter: Record<string, unknown>): Promise<Record<string, unknown>>
    createTransactionToken(parameter: Record<string, unknown>): Promise<string>
    createTransactionRedirectUrl(parameter: Record<string, unknown>): Promise<string>
    transaction: {
      notification(payload: Record<string, unknown>): Promise<Record<string, unknown>>
    }
  }

  const midtransClient: {
    CoreApi: typeof CoreApi
    Snap: typeof Snap
  }

  export default midtransClient
}
