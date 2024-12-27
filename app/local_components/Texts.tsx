import React, { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { toast } from "react-hot-toast";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
type UploadResponse = {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
};

const Texts: React.FC = () => {
  const fetcher = useFetcher<UploadResponse>();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.json') && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a JSON or CSV file');
        return;
      }
      setFile(selectedFile);
    }
  };

  const validateFileContent = (content: string, fileType: 'json' | 'csv'): boolean => {
    try {
      if (fileType === 'json') {
        const data = JSON.parse(content);
        if (!Array.isArray(data)) return false;
        return data.every(item => item.imageUrl && item.transcript);
      } else {
        const lines = content.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) return false;
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
        return headers.includes('imageurl') && headers.includes('transcript');
      }
    } catch {
      return false;
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const fileContent = reader.result as string;
        const fileType = file.name.endsWith('.json') ? 'json' : 'csv';
        
        if (!validateFileContent(fileContent, fileType)) {
          toast.error("File format is invalid. Please ensure it contains 'imageUrl' and 'transcript' fields");
          setIsLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("name", file.name);
        formData.append("data", fileContent);

        fetcher.submit(formData, { 
          method: "post",
          action: "/admin/texts",
        });
      } catch (error) {
        console.error("File reading error:", error);
        toast.error("Failed to read the file");
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read the file");
      setIsLoading(false);
    };

    reader.readAsText(file);
  };

  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        toast.success(fetcher.data.message || "File uploaded successfully");
        setFile(null);
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        toast.error(fetcher.data.error || "Failed to upload file");
      }
      setIsLoading(false);
    }
  }, [fetcher.data]);

  return (
    <div className="mb-2 mt-4 flex flex-col gap-4 items-center">
    <div className="flex gap-2 items-center">
      <Label htmlFor="text_file" className="text-sm font-medium text-gray-700">
        Text
      </Label>
      <Input
        id="text_file"
        type="file"
        accept=".json,.csv"
        onChange={handleFileChange}
        className="file-input file-input-bordered w-full max-w-xs"
      />
      <Button
        type="button"
        onClick={handleUpload}
        disabled={!file || isLoading}
        className="btn-sm rounded-md min-h-0 bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isLoading ? <div>uploading...</div> : <>upload</>}
      </Button>
    </div>
  
    {file && (
      <p className="text-sm text-gray-600">
        Selected file: {file.name}
      </p>
    )}
  </div>

  );
};

export default Texts;