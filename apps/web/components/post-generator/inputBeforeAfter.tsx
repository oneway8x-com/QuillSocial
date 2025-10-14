import { InputTemplateProps } from "./constTemplateWrapper";
import { useState } from "react";
import { Input, Label, TextArea } from "@quillsocial/ui";

const InputBeforeAfter: React.FC<InputTemplateProps> = ({ onInputData }) => {
  const [oldWay, setOldWay] = useState("");
  const [featureName, setFeatureName] = useState("");
  const [newWay, setNewWay] = useState("");
  const [metric, setMetric] = useState("");
  const [link, setLink] = useState("");

  const handleInputChange = () => {
    if (onInputData) {
      onInputData({
        countInput: 5,
        input: [
          { id: "old_way", value: oldWay },
          { id: "feature_name", value: featureName },
          { id: "new_way", value: newWay },
          { id: "metric", value: metric },
          { id: "link", value: link },
        ],
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Before (Old Way) *</Label>
        <TextArea
          placeholder="e.g., Scheduling posts took hours of manual work"
          value={oldWay}
          onChange={(e) => {
            setOldWay(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
          rows={2}
        />
      </div>

      <div>
        <Label>Feature Name *</Label>
        <Input
          type="text"
          placeholder="e.g., Smart Scheduler"
          value={featureName}
          onChange={(e) => {
            setFeatureName(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
        />
      </div>

      <div>
        <Label>After (New Way) *</Label>
        <TextArea
          placeholder="e.g., Now it's automated in seconds"
          value={newWay}
          onChange={(e) => {
            setNewWay(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
          rows={2}
        />
      </div>

      <div>
        <Label>Time/Metric Saved (optional)</Label>
        <Input
          type="text"
          placeholder="e.g., Saves 10 hours per week"
          value={metric}
          onChange={(e) => {
            setMetric(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
        />
      </div>

      <div>
        <Label>Link</Label>
        <Input
          type="url"
          placeholder="https://yourproduct.com"
          value={link}
          onChange={(e) => {
            setLink(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
        />
      </div>
    </div>
  );
};

export default InputBeforeAfter;
