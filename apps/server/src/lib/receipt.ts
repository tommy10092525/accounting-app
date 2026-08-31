// レシート/領収書画像の受け取り処理。立替申請(公開フォーム)と収入登録(管理者)の
// 両方で使うため、サイズ・形式の制限が片方だけ緩くならないようここに集約する。

export const MAX_RECEIPT_BYTES = 10 * 1024 * 1024; // 10MB
// bodyLimit用。フォームの他フィールド分の余裕を見て少し大きめにする
// (実質の上限は下の validateReceipt で個別に判定する)
export const RECEIPT_BODY_LIMIT_BYTES = MAX_RECEIPT_BYTES + 1024 * 1024;

const ALLOWED_RECEIPT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

export type ReceiptError = "receipt_too_large" | "receipt_invalid_type";

export function validateReceipt(file: File): ReceiptError | null {
  if (file.size > MAX_RECEIPT_BYTES) return "receipt_too_large";
  // 実ファイルのマジックバイトではなく申告されたMIMEタイプで判定している
  if (!ALLOWED_RECEIPT_TYPES.has(file.type)) return "receipt_invalid_type";
  return null;
}

/**
 * 画像をR2へ保存し、オブジェクトキーを返す。
 * キーは `receipts/{circleId}/{uuid}.{拡張子}` 形式。拡張子は元のファイル名ではなく
 * 検証済みのMIMEタイプから決める(不正な文字がキーに混ざるのを避けるため)。
 */
export async function putReceipt(r2: R2Bucket, circleId: string, file: File): Promise<string> {
  const extension = file.type.split("/")[1];
  const key = `receipts/${circleId}/${crypto.randomUUID()}.${extension}`;
  await r2.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });
  return key;
}

/** R2に保存済みの画像をレスポンスとして返す(Worker経由でプロキシする) */
export async function receiptResponse(r2: R2Bucket, key: string): Promise<Response | null> {
  const object = await r2.get(key);
  if (!object) return null;
  return new Response(object.body, {
    headers: { "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream" },
  });
}
