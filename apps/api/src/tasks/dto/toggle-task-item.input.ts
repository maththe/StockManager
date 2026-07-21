export class ToggleTaskItemInput {
  // true (padrão) confirma o item; false desfaz a confirmação.
  confirmed?: boolean;
  // Só é lida na contagem final de evento, onde a quantidade contada pode
  // divergir da solicitada. Nas demais tarefas a solicitada é imposta.
  confirmedQuantity?: number;
}
