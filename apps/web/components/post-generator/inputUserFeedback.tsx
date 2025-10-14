import { InputTemplateProps } from "./constTemplateWrapper";
import { useState } from "react";
import { Input, Label, TextArea } from "@quillsocial/ui";

const InputUserFeedback: React.FC<InputTemplateProps> = ({ onInputData }) => {
  const [featureName, setFeatureName] = useState("");
  const [feedbackExample, setFeedbackExample] = useState("");
  const [improvement, setImprovement] = useState("");
  const [gratitude, setGratitude] = useState("");

  const handleInputChange = () => {
    if (onInputData) {
      onInputData({
        countInput: 4,
        input: [
          { id: "feature_name", value: featureName },
          { id: "feedback_example", value: feedbackExample },
          { id: "improvement", value: improvement },
          { id: "gratitude", value: gratitude },
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
          placeholder="e.g., Dark Mode"
          value={featureName}
          onChange={(e) => {
            setFeatureName(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
        />
      </div>

      <div>
        <Label>User Feedback Example</Label>
        <TextArea
          placeholder="Quote or paraphrase the user feedback that inspired this"
          value={feedbackExample}
          onChange={(e) => {
            setFeedbackExample(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
          rows={3}
        />
      </div>

      <div>
        <Label>Feature Improvement / Benefit *</Label>
        <TextArea
          placeholder="What does this feature do? How does it help?"
          value={improvement}
          onChange={(e) => {
            setImprovement(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
          rows={3}
        />
      </div>

      <div>
        <Label>Gratitude Message (optional)</Label>
        <Input
          type="text"
          placeholder="e.g., Thank you to our amazing community!"
          value={gratitude}
          onChange={(e) => {
            setGratitude(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
        />
      </div>
    </div>
  );
};

export default InputUserFeedback;
