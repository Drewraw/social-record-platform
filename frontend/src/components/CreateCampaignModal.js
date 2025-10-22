import { useState } from "react";
import axios from "axios";
import { X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateCampaignModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    promise: "",
    source: "",
    recordedDate: "",
    question: ""
  });
  const [sourceImage, setSourceImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSourceImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSourceImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('promise', formData.promise);
      formDataToSend.append('source', formData.source);
      formDataToSend.append('recordedDate', formData.recordedDate);
      formDataToSend.append('question', formData.question);
      
      if (sourceImage) {
        formDataToSend.append('sourceImage', sourceImage);
      }

      await axios.post(`${API}/campaigns`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success("Campaign created successfully!");
      setFormData({
        title: "",
        promise: "",
        source: "",
        recordedDate: "",
        question: ""
      });
      setSourceImage(null);
      setImagePreview(null);
      onSuccess();
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        data-testid="create-campaign-modal"
        className="glass-card p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative fade-in"
      >
        {/* Close Button */}
        <button
          data-testid="close-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Create New Campaign</h2>
          <p className="text-gray-600">Track a new government promise and engage your community</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title" className="text-sm font-semibold text-gray-700 mb-2 block">
              Campaign Title *
            </Label>
            <Input
              id="title"
              name="title"
              data-testid="campaign-title-input"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., KR Puram-Whitefield Metro Operationalization"
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <Label htmlFor="promise" className="text-sm font-semibold text-gray-700 mb-2 block">
              Government Promise *
            </Label>
            <Textarea
              id="promise"
              name="promise"
              data-testid="campaign-promise-input"
              value={formData.promise}
              onChange={handleChange}
              placeholder="Describe the promise made by the government..."
              required
              rows={4}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="source" className="text-sm font-semibold text-gray-700 mb-2 block">
                Source *
              </Label>
              <Input
                id="source"
                name="source"
                data-testid="campaign-source-input"
                value={formData.source}
                onChange={handleChange}
                placeholder="e.g., Karnataka Congress Govt"
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <Label htmlFor="recordedDate" className="text-sm font-semibold text-gray-700 mb-2 block">
                Promise Date *
              </Label>
              <Input
                id="recordedDate"
                name="recordedDate"
                data-testid="campaign-date-input"
                type="date"
                value={formData.recordedDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
              Source Evidence (Screenshot/Photo) - Optional
            </Label>
            {!imagePreview ? (
              <label
                htmlFor="source-image-upload"
                className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 transition-colors"
              >
                <Upload className="w-5 h-5 text-gray-500" />
                <span className="text-gray-600">Upload screenshot or photo of source</span>
                <input
                  id="source-image-upload"
                  data-testid="source-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Source preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  data-testid="remove-source-image-btn"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="question" className="text-sm font-semibold text-gray-700 mb-2 block">
              Central Question *
            </Label>
            <Textarea
              id="question"
              name="question"
              data-testid="campaign-question-input"
              value={formData.question}
              onChange={handleChange}
              placeholder="What key question should citizens track? e.g., Will KR Puram-Whitefield Metro be operational within 5 months?"
              required
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              data-testid="cancel-campaign-btn"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-testid="submit-campaign-btn"
              disabled={submitting}
              className="flex-1 btn-primary"
              style={{ background: '#007bff' }}
            >
              {submitting ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaignModal;
