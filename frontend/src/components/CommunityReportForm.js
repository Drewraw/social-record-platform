import { useState } from "react";
import axios from "axios";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CommunityReportForm = ({ campaignId, onSuccess }) => {
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Please enter your observation");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('author', author || 'Anonymous');
      if (image) {
        formData.append('image', image);
      }

      await axios.post(`${API}/campaigns/${campaignId}/reports`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success("Report submitted successfully!");
      setContent("");
      setAuthor("");
      setImage(null);
      setImagePreview(null);
      onSuccess();
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-testid="community-report-form" className="bg-blue-50 p-6 rounded-lg mb-6 border border-blue-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Share Your Update</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="author" className="text-sm font-semibold text-gray-700 mb-2 block">
            Your Name (Optional)
          </Label>
          <Input
            id="author"
            data-testid="report-author-input"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Enter your name or stay anonymous"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <Label htmlFor="content" className="text-sm font-semibold text-gray-700 mb-2 block">
            Your Observation *
          </Label>
          <Textarea
            id="content"
            data-testid="report-content-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share what you've observed about this campaign's progress..."
            required
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-2 block">
            Add Photo (Optional)
          </Label>
          {!imagePreview ? (
            <label
              htmlFor="image-upload"
              className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
            >
              <Upload className="w-5 h-5 text-gray-500" />
              <span className="text-gray-600">Click to upload image</span>
              <input
                id="image-upload"
                data-testid="report-image-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover"
              />
              <button
                type="button"
                data-testid="remove-image-btn"
                onClick={removeImage}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <Button
          type="submit"
          data-testid="submit-report-btn"
          disabled={submitting}
          className="w-full btn-primary"
          style={{ background: '#007bff' }}
        >
          {submitting ? "Submitting..." : "Submit Update"}
        </Button>
      </form>
    </div>
  );
};

export default CommunityReportForm;
