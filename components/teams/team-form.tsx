import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { clientContainsProfanity } from "@/lib/client-profanity-filter";

// Define interfaces for the component props
interface TeamFormData {
  name: string;
  tag: string;
  description: string;
  logo?: string;
  // Add any other fields your team form has
}

interface TeamFormProps {
  onSubmit: (data: TeamFormData) => void;
  initialData?: Partial<TeamFormData>;
}

export function TeamForm({ onSubmit, initialData }: TeamFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    tag: initialData?.tag || "",
    description: initialData?.description || "",
    logo: initialData?.logo || "",
  });

  const [errors, setErrors] = useState({
    name: "",
    tag: "",
    description: "",
  });

  const [isValid, setIsValid] = useState(false);

  // Validate form on data change
  useEffect(() => {
    const newErrors = {
      name: "",
      tag: "",
      description: "",
    };

    // Check for profanity
    if (clientContainsProfanity(formData.name)) {
      newErrors.name = "Team name contains inappropriate language";
    }

    if (clientContainsProfanity(formData.tag)) {
      newErrors.tag = "Team tag contains inappropriate language";
    }

    if (clientContainsProfanity(formData.description)) {
      newErrors.description =
        "Team description contains inappropriate language";
    }

    // Other validations
    if (!formData.name) {
      newErrors.name = "Team name is required";
    }

    if (!formData.tag) {
      newErrors.tag = "Team tag is required";
    } else if (formData.tag.length > 5) {
      newErrors.tag = "Team tag must be 5 characters or less";
    }

    setErrors(newErrors);

    // Form is valid if there are no errors
    setIsValid(!Object.values(newErrors).some((error) => error));
  }, [formData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Double-check validation before submitting
    if (isValid) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Team Name
        </label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="tag" className="block text-sm font-medium mb-1">
          Team Tag
        </label>
        <Input
          id="tag"
          name="tag"
          value={formData.tag}
          onChange={handleChange}
          maxLength={5}
          className={errors.tag ? "border-red-500" : ""}
        />
        {errors.tag && (
          <p className="text-red-500 text-sm mt-1">{errors.tag}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Team Description
        </label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className={errors.description ? "border-red-500" : ""}
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description}</p>
        )}
      </div>

      <Button type="submit" disabled={!isValid}>
        {initialData ? "Update Team" : "Create Team"}
      </Button>
    </form>
  );
}
