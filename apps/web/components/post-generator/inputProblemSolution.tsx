import { InputTemplateProps } from "./constTemplateWrapper";
import { useState, useEffect } from "react";
import { Input, Label, TextArea } from "@quillsocial/ui";

const InputProblemSolution: React.FC<InputTemplateProps> = ({ onInputData }) => {
  const [problem, setProblem] = useState("");
  const [featureName, setFeatureName] = useState("");
  const [solution, setSolution] = useState("");
  const [proofMetric, setProofMetric] = useState("");
  const [link, setLink] = useState("");

  useEffect(() => {
    if (onInputData) {
      onInputData({
        countInput: 5,
        input: [
          { id: "problem", value: problem },
          { id: "feature_name", value: featureName },
          { id: "solution", value: solution },
          { id: "proof_metric", value: proofMetric, optional: true },
          { id: "link", value: link, optional: true },
        ],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem, featureName, solution, proofMetric, link]);

  return (
    <div className="space-y-4">
      <div>
        <Label>Problem Statement *</Label>
        <TextArea
          placeholder="What pain point or challenge are you solving?"
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <Label>Feature Name *</Label>
        <Input
          type="text"
          placeholder="e.g., Auto-Scheduling"
          value={featureName}
          onChange={(e) => setFeatureName(e.target.value)}
        />
      </div>

      <div>
        <Label>Solution Description *</Label>
        <TextArea
          placeholder="How does your feature solve the problem?"
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <Label>Proof / Result Metric (optional)</Label>
        <Input
          type="text"
          placeholder="e.g., Users save 5 hours per week"
          value={proofMetric}
          onChange={(e) => setProofMetric(e.target.value)}
        />
      </div>

      <div>
        <Label>Link (optional)</Label>
        <Input
          type="url"
          placeholder="https://yourproduct.com"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
      </div>
    </div>
  );
};

export default InputProblemSolution;
