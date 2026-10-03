'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, Check } from 'lucide-react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState({
    name: '',
    phone: '',
    requirement: '',
    location: '',
    budget: '',
    source: '',
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      // Reset state on new file
      setPreview([]);
      setHeaders([]);
      setSuccess(null);
      setError(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData, // No mapping yet, gets preview
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to preview');
      
      setPreview(data.preview);
      setHeaders(data.headers);
      
      // Auto-map based on common names
      const newMapping = { ...mapping };
      data.headers.forEach((h: string) => {
        const lower = h.toLowerCase();
        if (lower.includes('name')) newMapping.name = h;
        if (lower.includes('phone') || lower.includes('contact') || lower.includes('mobile')) newMapping.phone = h;
        if (lower.includes('req') || lower.includes('bhk') || lower.includes('type')) newMapping.requirement = h;
        if (lower.includes('loc')) newMapping.location = h;
        if (lower.includes('bud')) newMapping.budget = h;
        if (lower.includes('source') || lower.includes('campaign')) newMapping.source = h;
      });
      setMapping(newMapping);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to upload');
      
      let successMsg = `Successfully imported ${data.inserted} leads. ${data.invalidCount} invalid rows skipped.`;
      if (data.invalidRows && data.invalidRows.length > 0) {
        successMsg += ` Reason for skip: ${data.invalidRows[0].reason}`;
      }
      setSuccess(successMsg);
      setPreview([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Leads</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload a CSV or Excel file containing new real estate leads.
        </p>
      </div>

      <div className="mt-8 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
        <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4 flex text-sm text-gray-600 justify-center">
          <label
            htmlFor="file-upload"
            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
          >
            <span>Upload a file</span>
            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv, .xlsx, .xls" onChange={handleFileChange} />
          </label>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">CSV, XLSX up to 10MB</p>
        
        {file && (
          <div className="mt-4 text-sm font-medium text-gray-900">
            Selected: {file.name}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 p-4 rounded-md">
          <p className="text-green-800 text-sm flex items-center"><Check className="mr-2 h-4 w-4"/> {success}</p>
        </div>
      )}

      {file && preview.length === 0 && !success && (
        <button
          onClick={handlePreview}
          disabled={isUploading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          {isUploading ? 'Loading...' : 'Preview & Map Columns'}
        </button>
      )}

      {preview.length > 0 && (
        <div className="space-y-6">
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Map Columns</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              {['name', 'phone', 'requirement', 'location', 'budget', 'source'].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 capitalize">
                    {field} {['name', 'phone', 'requirement'].includes(field) && '*'}
                  </label>
                  <select
                    value={(mapping as any)[field]}
                    onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">-- Ignore / Not present --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Confirm & Import'}
              </button>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Data Preview (First 10 rows)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.map((row, i) => (
                    <tr key={i}>
                      {headers.map(h => (
                        <td key={h} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {String(row[h] || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
