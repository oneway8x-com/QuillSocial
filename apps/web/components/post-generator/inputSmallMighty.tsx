import { InputTemplateProps } from "./constTemplateWrapper";
import { useState } from "react";
import { Input, Label, TextArea } from "@quillsocial/ui";

const InputSmallMighty: React.FC<InputTemplateProps> = ({ onInputData }) => {
  const [featureName, setFeatureName] = useState("");
  const [tweak, setTweak] = useState("");
  const [benefit, setBenefit] = useState("");

  const handleInputChange = () => {
    if (onInputData) {
      onInputData({
        countInput: 3,
        input: [
          { id: "feature_name", value: featureName },
          { id: "tweak", value: tweak },
          { id: "benefit", value: benefit },
        ],
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Feature/Tweak Name *</Label>
        <Input
          type="text"
          placeholder="e.g., One-click duplicate"
          value={featureName}
          onChange={(e) => {
            setFeatureName(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
        />
      </div>

      <div>
        <Label>What Changed *</Label>
        <TextArea
          placeholder="Describe the small improvement you made"
          value={tweak}
          onChange={(e) => {
            setTweak(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
          rows={3}
        />
      </div>

      <div>
        <Label>Why It Matters *</Label>
        <TextArea
          placeholder="What benefit does this small change provide?"
          value={benefit}
          onChange={(e) => {
            setBenefit(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
          rows={3}
        />
      </div>
    </div>
  );
};

export default InputSmallMighty;
