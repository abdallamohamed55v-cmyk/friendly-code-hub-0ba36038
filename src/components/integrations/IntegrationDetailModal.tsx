import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface IntegrationDetailModalProps {
  integration: any | null;
  isConnected: boolean;
  isLoading: boolean;
  meta?: any;
  onConnect: (form?: any) => void;
  onDisconnect: () => void;
  onClose: () => void;
}

export default function IntegrationDetailModal({
  integration,
  isConnected,
  isLoading,
  onConnect,
  onDisconnect,
  onClose,
}: IntegrationDetailModalProps) {
  const open = !!integration;
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{integration?.name || "Integration"}</DialogTitle>
          <DialogDescription>
            {integration?.description || "Manage this integration."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {isConnected ? (
            <Button variant="destructive" disabled={isLoading} onClick={onDisconnect}>
              Disconnect
            </Button>
          ) : (
            <Button disabled={isLoading} onClick={() => onConnect()}>
              Connect
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
