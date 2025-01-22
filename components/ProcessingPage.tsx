"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import AnimatedGridPattern from "./ui/animated-grid-patterncopy";
import { Download, Upload } from "lucide-react";

export function ProcessingPage() {
  const router = useRouter();
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processImage = async () => {
      const imageData = localStorage.getItem('uploadedImage');
      
      if (!imageData) {
        router.push('/');
        return;
      }

      try {
        const API_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY;
        const API_HOST = process.env.NEXT_PUBLIC_RAPIDAPI_HOST;
        const API_URL = process.env.NEXT_PUBLIC_RAPIDAPI_URL;

        if (!API_KEY || !API_HOST || !API_URL) {
          throw new Error('Missing API configuration. Please check your environment variables.');
        }

        // Convert base64 to blob
        const base64Response = await fetch(imageData);
        const blob = await base64Response.blob();

        // Check for supported file types
        const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!supportedTypes.includes(blob.type)) {
          throw new Error('Unsupported file format. Please upload only JPG, JPEG or PNG images.');
        }

        const formData = new FormData();
        formData.append('image', blob, 'image.png');

        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'x-rapidapi-key': API_KEY,
            'x-rapidapi-host': API_HOST,
          },
          body: formData
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later.');
          } else if (response.status === 403) {
            throw new Error('Access forbidden. Please check your API key.');
          } else if (response.status === 400) {
            throw new Error('Unsupported file format. Please upload only JPG, JPEG or PNG images.');
          } else {
            throw new Error(`Server error. Please try again later.`);
          }
        }

        // Handle binary response
        const imageBlob = await response.blob();
        const imageUrl = URL.createObjectURL(imageBlob);
        setResult(imageUrl);

      } catch (err) {
        console.error('Processing error:', err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    processImage();

    // Cleanup function
    return () => {
      if (result) {
        URL.revokeObjectURL(result);
      }
    };
  }, [router]);

  const handleNewImage = () => {
    if (result) {
      URL.revokeObjectURL(result);
    }
    localStorage.removeItem('uploadedImage');
    router.push('/');
  };

  const handleDownload = async () => {
    if (result) {
      try {
        const link = document.createElement('a');
        link.href = result;
        link.download = 'processed-image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Download error:', err);
        setError('Failed to download the image');
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-black">
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {error && (
          <Alert variant="destructive" className="mb-4 max-w-md mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white text-center"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              <p>Processing your image...</p>
            </div>
          </motion.div>
        ) : result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto"
          >
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black/50 border border-white/10">
              <img
                src={result}
                alt="Processed image"
                className="w-full h-full object-contain"
                onError={() => setError('Failed to load the processed image')}
              />
            </div>

            <div className="flex flex-col sm:flex-row w-full justify-center gap-4">
              <Button 
                onClick={handleNewImage}
                className="flex-1 max-w-[200px] rounded-full bg-white text-black hover:bg-white/90"
                variant="outline"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload New Image
              </Button>
              <Button 
                onClick={handleDownload}
                className="flex-1 max-w-[200px] rounded-full bg-white text-black hover:bg-white/90"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Result
              </Button>
            </div>
          </motion.div>
        )}

        <AnimatedGridPattern
          numSquares={30}
          maxOpacity={0.1}
          duration={3}
          className={cn(
            "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]",
            "fixed inset-x-0 inset-y-[-30%] h-[200%] skew-y-12 pointer-events-none"
          )}
        />
      </div>
    </div>
  );
}