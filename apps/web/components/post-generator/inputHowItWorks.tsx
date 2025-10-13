import { InputTemplateProps } from "./constTemplateWrapper";
import { useState } from "react";
import { Input, Label, TextArea } from "@quillsocial/ui";

const InputHowItWorks: React.FC<InputTemplateProps> = ({ onInputData }) => {
  const [featureName, setFeatureName] = useState("");
  const [step1, setStep1] = useState("");
  const [step2, setStep2] = useState("");
  const [step3, setStep3] = useState("");
  const [proTip, setProTip] = useState("");

  const handleInputChange = () => {
    if (onInputData) {
      onInputData({
        countInput: 5,
        input: [
          { id: "feature_name", value: featureName },
          { id: "step_1", value: step1 },
          { id: "step_2", value: step2 },
          { id: "step_3", value: step3 },
          { id: "pro_tip", value: proTip },
        ],
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Feature Name *</Label>
        <Input
          type="text"
          placeholder="e.g., Content Calendar"
          value={featureName}
          onChange={(e) => {
            setFeatureName(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
        />
      </div>

      <div>
        <Label>Step 1 *</Label>
        <Input
          type="text"
          placeholder="First step to use this feature"
          value={step1}
          onChange={(e) => {
            setStep1(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
        />
      </div>

      <div>
        <Label>Step 2 *</Label>
        <Input
          type="text"
          placeholder="Second step"
          value={step2}
          onChange={(e) => {
            setStep2(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
        />
      </div>

      <div>
        <Label>Step 3 *</Label>
        <Input
          type="text"
          placeholder="Final step"
          value={step3}
          onChange={(e) => {
            setStep3(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
        />
      </div>

      <div>
        <Label>Pro Tip (optional)</Label>
        <TextArea
          placeholder="Share a bonus tip or advanced usage"
          value={proTip}
          onChange={(e) => {
            setProTip(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
          rows={2}
        />
      </div>
    </div>
  );
};

export default InputHowItWorks;
