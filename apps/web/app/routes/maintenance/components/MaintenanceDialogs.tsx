import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';

interface MaintenanceDialogsProps {
  hasDivergence: boolean;
  confirmOpen: boolean;
  cancelOpen: boolean;
  onConfirmOpenChange: (open: boolean) => void;
  onCancelOpenChange: (open: boolean) => void;
  onConfirmConclude: () => void;
  onConfirmCancel: () => void;
}

export function MaintenanceDialogs({
  hasDivergence,
  confirmOpen,
  cancelOpen,
  onConfirmOpenChange,
  onCancelOpenChange,
  onConfirmConclude,
  onConfirmCancel,
}: MaintenanceDialogsProps) {
  return (
    <>
      <AlertDialog open={confirmOpen} onOpenChange={onConfirmOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir manutenção?</AlertDialogTitle>
            <AlertDialogDescription>
              O item será devolvido ao estoque disponível. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmConclude}
              className="bg-green-600 hover:bg-green-700"
            >
              Concluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelOpen} onOpenChange={onCancelOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar manutenção?</AlertDialogTitle>
            <AlertDialogDescription>
              {hasDivergence
                ? 'O item permanecerá fora do estoque disponível (avaria não resolvida).'
                : 'O item será devolvido ao estoque disponível.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmCancel}
              className="bg-destructive hover:bg-destructive/90"
            >
              Cancelar manutenção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
