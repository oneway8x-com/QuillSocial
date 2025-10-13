import { InputTemplateProps } from "./constTemplateWrapper";
import { useState } from "react";
import { Input, Label, TextArea } from "@quillsocial/ui";

const InputFeatureLaunch: React.FC<InputTemplateProps> = ({ onInputData }) => {
  const [featureName, setFeatureName] = useState("");
  const [userBenefit, setUserBenefit] = useState("");
  const [useCase, setUseCase] = useState("");
  const [ctaLink, setCtaLink] = useState("");

  const handleInputChange = () => {
    if (onInputData) {
      onInputData({
        countInput: 4,
        input: [
          { id: "feature_name", value: featureName },
          { id: "user_benefit", value: userBenefit },
          { id: "use_case", value: useCase },
          { id: "cta_link", value: ctaLink },
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
        <Label>User Benefit *</Label>
        <TextArea
          placeholder="What problem does it solve? Why should users care?"
          value={userBenefit}
          onChange={(e) => {
            setUserBenefit(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
          rows={3}
        />
      </div>

      <div>
        <Label>Example Use Case</Label>
        <TextArea
          placeholder="Describe a specific scenario where this feature helps"
          value={useCase}
          onChange={(e) => {
            setUseCase(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
          rows={3}
        />
      </div>

      <div>
        <Label>Call-to-Action Link</Label>
        <Input
          type="url"
          placeholder="https://yourproduct.com/feature"
          value={ctaLink}
          onChange={(e) => {
            setCtaLink(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
        />
      </div>
    </div>
  );
};

export default InputFeatureLaunch;
