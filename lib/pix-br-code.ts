type PixPayloadInput = {
  key: string;
  receiverName: string;
  receiverCity: string;
  amountInCents: number;
  txid: string;
};

function field(id: string, value: string) {
  const length = value.length.toString().padStart(2, "0");

  if (value.length > 99) {
    throw new Error(`O campo Pix ${id} excede o tamanho permitido.`);
  }

  return `${id}${length}${value}`;
}

function sanitizeMerchantText(value: string, maxLength: number) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeTxid(value: string) {
  const txid = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 25);

  return txid || "***";
}

function crc16(payload: string) {
  let crc = 0xffff;

  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8;

    for (let bit = 0; bit < 8; bit += 1) {
      crc =
        (crc & 0x8000) !== 0
          ? ((crc << 1) ^ 0x1021) & 0xffff
          : (crc << 1) & 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function createPixCopyPaste(input: PixPayloadInput) {
  const key = input.key.trim();
  const receiverName = sanitizeMerchantText(input.receiverName, 25);
  const receiverCity = sanitizeMerchantText(input.receiverCity, 15);
  const txid = sanitizeTxid(input.txid);

  if (!key) {
    throw new Error("A chave Pix não foi configurada.");
  }

  if (!receiverName) {
    throw new Error("O nome do recebedor Pix não foi configurado.");
  }

  if (!receiverCity) {
    throw new Error("A cidade do recebedor Pix não foi configurada.");
  }

  if (
    !Number.isSafeInteger(input.amountInCents) ||
    input.amountInCents <= 0
  ) {
    throw new Error("O valor do Pix precisa ser maior que zero.");
  }

  const merchantAccount = [
    field("00", "BR.GOV.BCB.PIX"),
    field("01", key),
  ].join("");

  const additionalData = field("05", txid);
  const amount = (input.amountInCents / 100).toFixed(2);

  const payloadWithoutCrc = [
    field("00", "01"),
    field("26", merchantAccount),
    field("52", "0000"),
    field("53", "986"),
    field("54", amount),
    field("58", "BR"),
    field("59", receiverName),
    field("60", receiverCity),
    field("62", additionalData),
    "6304",
  ].join("");

  return `${payloadWithoutCrc}${crc16(payloadWithoutCrc)}`;
}
