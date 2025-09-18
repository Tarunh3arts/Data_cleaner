import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";

export default function FileUploader({ setUploadedFile }) {
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    setUploadedFile(file);
  }, [setUploadedFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      className="border-4 border-dashed border-white p-8 text-center cursor-pointer rounded-xl hover:bg-white/20 transition"
    >
      <input {...getInputProps()} />
      {isDragActive ? <p>Drop the file here ...</p> : <p>Drag & Drop CSV/XLSX file here, or click to select</p>}
    </div>
  );
}
