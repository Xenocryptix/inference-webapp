'use client';

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<{ predicted_class: string; confidence: number } | null>(null);
  const [denoisedImage, setDenoisedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedFile) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setPrediction(null);
      setDenoisedImage(null);
    }
  };

  const handleClassify = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Classification failed');

      const result = await response.json();
      setPrediction(result);
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred during classification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDenoise = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('http://localhost:5000/denoise', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Denoising failed');

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setDenoisedImage(imageUrl);
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred during denoising');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md">
        <Tabs defaultValue="classify" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="classify">Classify</TabsTrigger>
            <TabsTrigger value="denoise">Denoise</TabsTrigger>
          </TabsList>

          <TabsContent value="classify">
            <Card>
              <CardHeader>
                <CardTitle>Image Classification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="image-classify">Upload Image</Label>
                  <Input
                    id="image-classify"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                {selectedFile && (
                  <p className="text-sm text-gray-500">
                    Selected file: {selectedFile.name}
                  </p>
                )}
                {preview && (
                  <div className="relative w-full h-48">
                    <Image
                      src={preview}
                      alt="Preview"
                      fill
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                )}
                <Button 
                  className="w-full" 
                  onClick={handleClassify} 
                  disabled={!selectedFile || isLoading}
                >
                  {isLoading ? 'Processing...' : (
                    <>
                      <Upload className="mr-2 h-4 w-4" /> Classify Image
                    </>
                  )}
                </Button>
                {prediction && (
                  <div className="p-4 bg-gray-100 rounded-md">
                    <p><strong>Predicted Class:</strong> {prediction.predicted_class}</p>
                    <p><strong>Confidence:</strong> {(prediction.confidence * 100).toFixed(2)}%</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="denoise">
            <Card>
              <CardHeader>
                <CardTitle>Image Denoising</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="image-denoise">Upload Image</Label>
                  <Input
                    id="image-denoise"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                {selectedFile && (
                  <p className="text-sm text-gray-500">
                    Selected file: {selectedFile.name}
                  </p>
                )}
                {preview && (
                  <div className="relative w-full h-48">
                    <Image
                      src={preview}
                      alt="Preview"
                      fill
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                )}
                <Button 
                  className="w-full" 
                  onClick={handleDenoise} 
                  disabled={!selectedFile || isLoading}
                >
                  {isLoading ? 'Processing...' : (
                    <>
                      <Upload className="mr-2 h-4 w-4" /> Denoise Image
                    </>
                  )}
                </Button>
                {denoisedImage && (
                  <div className="p-4 bg-gray-100 rounded-md">
                    <p><strong>Result:</strong></p>
                    <div className="relative w-full h-48 mt-2">
                      <Image
                        src={denoisedImage}
                        alt="Denoised"
                        fill
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}