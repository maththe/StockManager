export class ToggleTaskItemInput {
  // true (padrão) confirma o item; false desfaz a confirmação.
  // A quantidade não é informada: o backend impõe a esperada (solicitada menos
  // o que já foi registrado em divergência).
  confirmed?: boolean;
}
