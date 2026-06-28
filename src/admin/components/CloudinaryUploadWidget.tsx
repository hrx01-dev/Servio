import { useEffect, useRef, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Upload } from 'lucide-react';

interface CloudinaryUploadWidgetProps {
  onSuccess: (url: string) => void;
  className?: string;
}

export function CloudinaryUploadWidget({ onSuccess, className }: CloudinaryUploadWidgetProps) {
  const cloudinaryRef = useRef<{
    createUploadWidget: (
      options: Record<string, unknown>,
      callback: (error: Error | null, result: { event: string; info: { secure_url: string } } | undefined) => void
    ) => { open: () => void };
  }>();
  const widgetRef = useRef<{ open: () => void }>();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const scriptId = 'cloudinary-widget-script';
    const existingScript = document.getElementById(scriptId);

    const onScriptLoad = () => {
      setIsLoaded(true);
      // @ts-expect-error window.cloudinary is injected by the external script
      cloudinaryRef.current = window.cloudinary;
      
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.replace(/['"]/g, '').trim();
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.replace(/['"]/g, '').trim();

      if (!cloudName || !uploadPreset || !cloudinaryRef.current) {
        console.error("Cloudinary environment variables or script are missing.");
        return;
      }

      widgetRef.current = cloudinaryRef.current.createUploadWidget(
        {
          cloudName: cloudName,
          uploadPreset: uploadPreset,
          sources: ['local', 'url', 'camera'],
          multiple: false,
          maxFiles: 1,
        },
        function (error: Error | null, result: { event: string; info: { secure_url: string } } | undefined) {
          if (!error && result && result.event === 'success') {
            onSuccess(result.info.secure_url);
          }
        }
      );
    };

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://upload-widget.cloudinary.com/global/all.js';
      script.async = true;
      script.onload = onScriptLoad;
      document.body.appendChild(script);
    } else {
      if ((window as unknown as { cloudinary?: unknown }).cloudinary) {
        onScriptLoad();
      } else {
        existingScript.addEventListener('load', onScriptLoad);
      }
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Button 
      type="button" 
      variant="secondary" 
      className={className}
      disabled={!isLoaded}
      onClick={() => {
        if (!widgetRef.current) {
          alert("Cloudinary is not initialized. If you just added the API keys to .env, please restart your Vite dev server.");
          return;
        }
        widgetRef.current.open();
      }}
    >
      <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
      Upload Image
    </Button>
  );
}
