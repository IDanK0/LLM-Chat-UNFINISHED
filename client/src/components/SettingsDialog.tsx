import { useState } from "react";
import { ApiSettings, getSettings, saveSettings, resetSettings } from "@/lib/settingsStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { SettingsIcon, RefreshCwIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settings, setSettings] = useState<ApiSettings>(getSettings());
  const { toast } = useToast();

  // Aggiorna le impostazioni locali quando cambiano i valori
  const updateSettings = (key: keyof ApiSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Salva le impostazioni
  const handleSave = () => {
    saveSettings(settings);
    toast({
      title: "Impostazioni salvate",
      description: "Le tue impostazioni sono state aggiornate con successo"
    });
    onOpenChange(false);
  };

  // Reset alle impostazioni predefinite
  const handleReset = () => {
    const defaults = resetSettings();
    setSettings(defaults);
    toast({
      title: "Impostazioni reimpostate",
      description: "Le impostazioni sono state riportate ai valori predefiniti"
    });
  };

  // Formatta la temperatura per la visualizzazione
  const formatTemperature = (value: number) => {
    return value.toFixed(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-sidebar border-primary/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            Impostazioni API
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Personalizza i parametri della richiesta API.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          {/* URL API */}
          <div className="space-y-2">
            <Label htmlFor="apiUrl" className="text-white">URL API</Label>
            <Input
              id="apiUrl"
              value={settings.apiUrl}
              onChange={(e) => updateSettings("apiUrl", e.target.value)}
              className="bg-white/10 border-primary/30 text-white"
              placeholder="Inserisci l'URL dell'API"
            />
          </div>
          
          {/* Temperatura con slider migliorato */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="temperature" className="text-white">Temperatura</Label>
              <span className="text-primary text-sm font-medium bg-primary/20 px-2 py-1 rounded-md">
                {formatTemperature(settings.temperature)}
              </span>
            </div>
            
            <div className="py-2">
              <Slider
                id="temperature"
                min={0}
                max={1}
                step={0.1}
                value={[settings.temperature]}
                onValueChange={(values) => updateSettings("temperature", values[0])}
                className="custom-slider"
              />
            </div>
            
            <style jsx global>{`
              /* Stili per lo slider custom */
              .custom-slider {
                position: relative;
                display: flex;
                align-items: center;
                width: 100%;
                height: 20px;
                touch-action: none;
              }
              
              /* Traccia dello slider (sfondo) */
              .custom-slider [data-orientation="horizontal"] {
                height: 8px;
                width: 100%;
                background-color: rgba(59, 130, 246, 0.3);
                position: relative;
                border-radius: 9999px;
              }
              
              /* Parte attiva della traccia */
              .custom-slider [data-orientation="horizontal"] > span:first-child {
                position: absolute;
                background-color: #3b82f6;
                height: 100%;
                border-radius: 9999px;
              }
              
              /* Contenitore del thumb */
              .custom-slider span:has([role="slider"]) {
                position: absolute;
                transform: translateX(-50%);
              }
              
              /* Thumb (pallino) */
              .custom-slider [role="slider"] {
                display: block;
                width: 22px;
                height: 22px;
                background-color: #3b82f6;
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                transition: all 0.2s;
              }
              
              /* Stato hover del thumb */
              .custom-slider [role="slider"]:hover {
                transform: scale(1.1);
                box-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
              }
              
              /* Stato focus del thumb */
              .custom-slider [role="slider"]:focus-visible {
                outline: none;
                box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3);
              }
            `}</style>
            
            <p className="text-xs text-muted-foreground">
              Valori più bassi producono risposte più determinate e prevedibili, valori più alti generano output più casuali e creativi.
            </p>
          </div>
          
          {/* Token massimi */}
          <div className="space-y-2">
            <Label htmlFor="maxTokens" className="text-white">Token massimi</Label>
            <Input
              id="maxTokens"
              type="number"
              min={-1}
              value={settings.maxTokens}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && value >= -1) {
                  updateSettings("maxTokens", value);
                }
              }}
              className="bg-white/10 border-primary/30 text-white"
            />
            <p className="text-xs text-muted-foreground">
              Imposta a -1 per non avere limiti di token. Altrimenti, specifica un numero intero positivo.
            </p>
          </div>
          
          {/* Streaming */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="stream" className="text-white">Streaming</Label>
              <p className="text-xs text-muted-foreground">
                Attiva per ricevere la risposta in tempo reale.
              </p>
            </div>
            <Switch
              id="stream"
              checked={settings.stream}
              onCheckedChange={(checked) => updateSettings("stream", checked)}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
        
        <DialogFooter className="flex justify-center gap-3 mt-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-primary/30 text-white hover:bg-primary/20 flex items-center gap-1"
          >
            <RefreshCwIcon className="h-4 w-4" />
            Reimposta
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-primary/30 text-white hover:bg-primary/20"
          >
            Annulla
          </Button>
          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90"
          >
            Salva impostazioni
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}