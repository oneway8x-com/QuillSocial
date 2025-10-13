import { InputTemplateProps } from "./constTemplateWrapper";
import { useState } from "react";
import { Input, Label, TextArea } from "@quillsocial/ui";

const InputFounderVoice: React.FC<InputTemplateProps> = ({ onInputData }) => {
  const [featureName, setFeatureName] = useState("");
  const [whyBuilt, setWhyBuilt] = useState("");
  const [problemInspired, setProblemInspired] = useState("");
  const [futureVision, setFutureVision] = useState("");

  const handleInputChange = () => {
    if (onInputData) {
      onInputData({
        countInput: 4,
        input: [
          { id: "feature_name", value: featureName },
          { id: "why_built", value: whyBuilt },
          { id: "problem_inspired", value: problemInspired },
          { id: "future_vision", value: futureVision },
        ],
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Feature/Product Name *</Label>
        <Input
          type="text"
          placeholder="e.g., AI Content Assistant"
          value={featureName}
          onChange={(e) => {
            setFeatureName(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
        />
      </div>

      <div>
        <Label>Why You Built It *</Label>
        <TextArea
          placeholder="Tell the story behind this feature. What motivated you?"
          value={whyBuilt}
          onChange={(e) => {
            setWhyBuilt(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
          rows={4}
        />
      </div>

      <div>
        <Label>Problem That Inspired It</Label>
        <TextArea
          placeholder="What specific problem or challenge led to building this?"
          value={problemInspired}
          onChange={(e) => {
            setProblemInspired(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
          rows={3}
        />
      </div>

      <div>
        <Label>Future Vision (optional)</Label>
        <TextArea
          placeholder="What's your bigger goal? Where is this heading?"
          value={futureVision}
          onChange={(e) => {
            setFutureVision(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
          rows={3}
        />
      </div>
    </div>
  );
};

export default InputFounderVoice;
