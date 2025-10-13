import { InputTemplateProps } from "./constTemplateWrapper";
import { useState } from "react";
import { Input, Label, TextArea } from "@quillsocial/ui";

const InputSneakPeek: React.FC<InputTemplateProps> = ({ onInputData }) => {
  const [featureName, setFeatureName] = useState("");
  const [valueProposition, setValueProposition] = useState("");
  const [limitedAccessNote, setLimitedAccessNote] = useState("");
  const [betaLink, setBetaLink] = useState("");

  const handleInputChange = () => {
    if (onInputData) {
      onInputData({
        countInput: 4,
        input: [
          { id: "feature_name", value: featureName },
          { id: "value_proposition", value: valueProposition },
          { id: "limited_access", value: limitedAccessNote },
          { id: "beta_link", value: betaLink },
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
        <Label>Value Proposition *</Label>
        <TextArea
          placeholder="What value does this feature provide? How does it help users?"
          value={valueProposition}
          onChange={(e) => {
            setValueProposition(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
          rows={3}
        />
      </div>

      <div>
        <Label>Limited Access Note</Label>
        <Input
          type="text"
          placeholder="e.g., First 100 users, Beta testers only"
          value={limitedAccessNote}
          onChange={(e) => {
            setLimitedAccessNote(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
        />
      </div>

      <div>
        <Label>Beta Sign-up Link (optional)</Label>
        <Input
          type="url"
          placeholder="https://yourproduct.com/beta"
          value={betaLink}
          onChange={(e) => {
            setBetaLink(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
        />
      </div>
    </div>
  );
};

export default InputSneakPeek;
