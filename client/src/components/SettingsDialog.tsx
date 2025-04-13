import { useState, useEffect } from "react";
import { ApiSettings, getSettings, saveSettings, resetSettings } from "@/lib/settingsStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { SettingsIcon, RefreshCwIcon, SaveIcon, XIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settings, setSettings] = useState<ApiSettings>(getSettings());
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Monitor della larghezza della finestra per una responsività più fluida
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Aggiorna le impostazioni locali
  const updateSettings = (key: keyof ApiSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Salva le impostazioni
  const handleSave = () => {
    saveSettings(settings);
    toast({
      title: "Impostazioni salvate",
      description: "Le tue impostazioni sono state aggiornate con successo",
      variant: "success"
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

  // Definisco le dimensioni dei controlli in base alla larghezza dello schermo
  const getControlSize = () => {
    if (windowWidth < 480) return 'xs';
    if (windowWidth < 640) return 'sm';
    if (windowWidth < 768) return 'md';
    if (windowWidth < 1024) return 'lg';
    return 'xl';
  };
  
  const controlSize = getControlSize();
  
  // Determina la larghezza massima del dialog in base alla dimensione dello schermo
  const getDialogMaxWidth = () => {
    if (windowWidth < 480) return 'w-[calc(100%-24px)]';
    if (windowWidth < 768) return 'max-w-[450px]';
    if (windowWidth < 1024) return 'max-w-[550px]';
    return 'max-w-[650px]';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`bg-sidebar border-primary/30 text-white ${getDialogMaxWidth()} rounded-xl transition-all duration-300 ease-in-out backdrop-blur-sm`}
        style={{
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
          backgroundImage: 'linear-gradient(to bottom right, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98))'
        }}
      >
        <DialogHeader className="space-y-2 sm:space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl text-white/90">
            <SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="bg-gradient-to-r from-primary/90 to-blue-400 text-transparent bg-clip-text">
              Impostazioni API
            </span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm sm:text-base">
            Personalizza i parametri della richiesta API.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-5 sm:space-y-6 lg:space-y-8 overflow-y-auto max-h-[60vh] sm:max-h-[65vh] pr-2"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#3b82f6 transparent' }}>
          {/* URL API */}
          <div className="settings-section space-y-2">
            <Label htmlFor="apiUrl" className="text-white text-sm sm:text-base font-medium">URL API</Label>
            <Input
              id="apiUrl"
              value={settings.apiUrl}
              onChange={(e) => updateSettings("apiUrl", e.target.value)}
              className="bg-white/10 border-primary/30 text-white hover:border-primary/50 focus:border-primary focus-visible:ring-1 focus-visible:ring-primary/50 transition-all"
              placeholder="Inserisci l'URL dell'API"
              style={{ 
                height: controlSize === 'xs' ? '38px' : controlSize === 'sm' ? '40px' : '44px',
                fontSize: controlSize === 'xs' ? '14px' : controlSize === 'sm' ? '15px' : '16px'
              }}
            />
          </div>
          
          {/* Temperatura con slider migliorato */}
          <div className="settings-section space-y-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="temperature" className="text-white text-sm sm:text-base font-medium">
                Temperatura
              </Label>
              <div className="temperature-value text-primary text-sm font-medium rounded-md 
                  flex items-center justify-center transition-all"
                  style={{
                    background: `rgba(59, 130, 246, ${0.1 + settings.temperature * 0.2})`,
                    padding: controlSize === 'xs' ? '2px 8px' : '4px 10px',
                    minWidth: controlSize === 'xs' ? '40px' : '50px'
                  }}>
                {formatTemperature(settings.temperature)}
              </div>
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
                height: ${controlSize === 'xs' ? '24px' : controlSize === 'sm' ? '26px' : '30px'};
                touch-action: none;
              }
              
              /* Traccia dello slider (sfondo) */
              .custom-slider [data-orientation="horizontal"] {
                height: ${controlSize === 'xs' ? '8px' : controlSize === 'sm' ? '9px' : '10px'};
                width: 100%;
                background: linear-gradient(to right, 
                  rgba(59, 130, 246, 0.2), 
                  rgba(59, 130, 246, 0.3), 
                  rgba(96, 165, 250, 0.4)
                );
                position: relative;
                border-radius: 9999px;
              }
              
              /* Parte attiva della traccia */
              .custom-slider [data-orientation="horizontal"] > span:first-child {
                position: absolute;
                background: linear-gradient(to right, #3b82f6, #60a5fa);
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
                display: flex;
                align-items: center;
                justify-content: center;
                width: ${controlSize === 'xs' ? '22px' : controlSize === 'sm' ? '24px' : '28px'};
                height: ${controlSize === 'xs' ? '22px' : controlSize === 'sm' ? '24px' : '28px'};
                background: linear-gradient(to bottom right, #60a5fa, #3b82f6);
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                transition: all 0.2s ease;
              }
              
              /* Stato hover del thumb */
              .custom-slider [role="slider"]:hover {
                transform: scale(1.1);
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4), 0 0 0 5px rgba(59, 130, 246, 0.2);
              }
              
              /* Stato focus del thumb */
              .custom-slider [role="slider"]:focus-visible {
                outline: none;
                box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3);
              }

              /* Transizioni fluide */
              .settings-section {
                transition: all 0.3s ease;
              }
              
              /* Stili per scrollbar personalizzata */
              div::-webkit-scrollbar {
                width: 5px;
              }
              
              div::-webkit-scrollbar-track {
                background: transparent;
              }
              
              div::-webkit-scrollbar-thumb {
                background: #3b82f6;
                border-radius: 10px;
              }
              
              div::-webkit-scrollbar-thumb:hover {
                background: #60a5fa;
              }
            `}</style>
            
            <p className="text-xs sm:text-sm text-muted-foreground italic">
              Valori più bassi producono risposte più determinate e prevedibili, valori più alti generano output più creativi.
            </p>
          </div>
          
          {/* Token massimi */}
          <div className="settings-section space-y-2 sm:space-y-3 bg-white/5 p-3 sm:p-4 rounded-lg transition-all hover:bg-white/8">
            <Label htmlFor="maxTokens" className="text-white text-sm sm:text-base font-medium">Token massimi</Label>
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
              className="bg-white/10 border-primary/30 text-white hover:border-primary/50 focus:border-primary transition-all"
              style={{ 
                height: controlSize === 'xs' ? '38px' : controlSize === 'sm' ? '40px' : '44px',
                fontSize: controlSize === 'xs' ? '14px' : controlSize === 'sm' ? '15px' : '16px'
              }}
            />
            <p className="text-xs sm:text-sm text-muted-foreground">
              Imposta a -1 per non avere limiti di token. Altrimenti, specifica un numero intero positivo.
            </p>
          </div>
          
          {/* Sezione opzioni avanzate con effetto hover */}
          <div className="settings-section p-3 sm:p-4 lg:p-5 rounded-lg bg-gradient-to-br from-primary/10 to-blue-400/5">
            {/* Titolo automatico */}
            <div className={`${windowWidth < 640 ? 'flex flex-col space-y-2' : 'flex items-center justify-between'} 
                             mb-4 sm:mb-5 pb-4 sm:pb-5 border-b border-primary/20`}>
              <div className={windowWidth < 640 ? 'mb-2' : ''}>
                <Label htmlFor="autoGenerateTitle" className="text-white text-sm sm:text-base font-medium">
                  Generazione automatica titoli
                </Label>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Genera automaticamente titoli per le chat in base al contenuto della conversazione.
                </p>
              </div>
              <Switch
                id="autoGenerateTitle"
                checked={settings.autoGenerateTitle}
                onCheckedChange={(checked) => updateSettings("autoGenerateTitle", checked)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary/50"
                style={{
                  height: controlSize === 'xs' ? '22px' : controlSize === 'sm' ? '24px' : '26px',
                  width: controlSize === 'xs' ? '40px' : controlSize === 'sm' ? '44px' : '48px'
                }}
              />
            </div>
              
            {/* Streaming toggle */}
            <div className={`${windowWidth < 640 ? 'flex flex-col space-y-2' : 'flex items-center justify-between'}`}>
              <div className={windowWidth < 640 ? 'mb-2' : ''}>
                <Label htmlFor="stream" className="text-white text-sm sm:text-base font-medium">
                  Streaming
                </Label>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Attiva per visualizzare le risposte con animazione.
                </p>
              </div>
              <Switch
                id="stream"
                checked={settings.stream}
                onCheckedChange={(checked) => updateSettings("stream", checked)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary/50"
                style={{
                  height: controlSize === 'xs' ? '22px' : controlSize === 'sm' ? '24px' : '26px',
                  width: controlSize === 'xs' ? '40px' : controlSize === 'sm' ? '44px' : '48px'
                }}
              />
            </div>
          
            {/* Velocità animazione (visibile solo se lo streaming è attivo) */}
            {settings.stream && (
              <div className={`space-y-3 pl-3 sm:pl-4 border-l-2 border-primary/30 mt-4 sm:mt-5 
                              transition-all duration-300 ease-in-out`}
                    style={{animation: "fadeIn 0.3s ease-in-out"}}>
                <div className="flex justify-between items-center">
                  <Label htmlFor="animationSpeed" className="text-white text-sm sm:text-base font-medium">
                    Velocità animazione
                  </Label>
                  <span className="text-primary text-sm font-medium rounded-md"
                      style={{
                        background: `rgba(59, 130, 246, ${0.1 + (settings.animationSpeed / 40)})`,
                        padding: controlSize === 'xs' ? '2px 8px' : '4px 10px',
                      }}>
                    {settings.animationSpeed || 15} parole/s
                  </span>
                </div>
          
                <div className="py-2">
                  <Slider
                    id="animationSpeed"
                    min={5}
                    max={30}
                    step={1}
                    value={[settings.animationSpeed || 15]}
                    onValueChange={(values) => updateSettings("animationSpeed", values[0])}
                    className="custom-slider"
                  />
                </div>
                
                <p className="text-xs sm:text-sm text-muted-foreground italic">
                  Regola la velocità con cui appaiono le parole nell'animazione.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className={`
          ${windowWidth < 640 ? 'flex-col space-y-3' : windowWidth < 1024 ? 'flex justify-between' : 'flex justify-center gap-3'} 
          mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10`}>
          <Button
            variant="outline"
            onClick={handleReset}
            className={`border-primary/30 text-white hover:bg-primary/20 flex items-center gap-2 transition-all duration-300
                       ${windowWidth < 640 ? 'w-full py-3 order-2' : 'py-2 px-3 sm:px-4'}`}
          >
            <RefreshCwIcon className="h-4 w-4" />
            <span>Reimposta</span>
          </Button>
          <div className={`flex ${windowWidth < 640 ? 'w-full space-x-3' : 'space-x-3'}`}>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className={`border-primary/30 text-white hover:bg-white/10 transition-all duration-300
                         ${windowWidth < 640 ? 'flex-1 py-3' : 'py-2 px-3 sm:px-4'}`}
            >
              <XIcon className="h-4 w-4 mr-2" />
              <span>Annulla</span>
            </Button>
            <Button
              onClick={handleSave}
              className={`bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-600 text-white transition-all duration-300
                         ${windowWidth < 640 ? 'flex-1 py-3' : 'py-2 px-3 sm:px-4'}`}
            >
              <SaveIcon className="h-4 w-4 mr-2" />
              <span>Salva</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}