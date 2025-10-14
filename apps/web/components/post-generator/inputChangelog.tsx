import { InputTemplateProps } from "./constTemplateWrapper";
import { useState } from "react";
import { Input, Label, TextArea } from "@quillsocial/ui";

const InputChangelog: React.FC<InputTemplateProps> = ({ onInputData }) => {
  const [productName, setProductName] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [improved, setImproved] = useState("");
  const [fixed, setFixed] = useState("");
  const [behindScenes, setBehindScenes] = useState("");
  const [changelogLink, setChangelogLink] = useState("");

  const handleInputChange = () => {
    if (onInputData) {
      onInputData({
        countInput: 6,
        input: [
          { id: "product_name", value: productName },
          { id: "new_feature", value: newFeature },
          { id: "improved", value: improved },
          { id: "fixed", value: fixed },
          { id: "behind_scenes", value: behindScenes },
          { id: "changelog_link", value: changelogLink },
        ],
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Product Name *</Label>
        <Input
          type="text"
          placeholder="e.g., QuillSocial"
          value={productName}
          onChange={(e) => {
            setProductName(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
        />
      </div>

      <div>
        <Label>New Feature(s)</Label>
        <TextArea
          placeholder="What's new? List new features or capabilities"
          value={newFeature}
          onChange={(e) => {
            setNewFeature(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
          rows={2}
        />
      </div>

      <div>
        <Label>Improved Feature(s)</Label>
        <TextArea
          placeholder="What did you improve or enhance?"
          value={improved}
          onChange={(e) => {
            setImproved(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
          rows={2}
        />
      </div>

      <div>
        <Label>Fixed Issue(s)</Label>
        <TextArea
          placeholder="What bugs or issues did you fix?"
          value={fixed}
          onChange={(e) => {
            setFixed(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
          rows={2}
        />
      </div>

      <div>
        <Label>Behind-the-Scenes Note (optional)</Label>
        <Input
          type="text"
          placeholder="e.g., The team worked hard to improve performance"
          value={behindScenes}
          onChange={(e) => {
            setBehindScenes(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
        />
      </div>

      <div>
        <Label>Full Changelog Link (optional)</Label>
        <Input
          type="url"
          placeholder="https://yourproduct.com/changelog"
          value={changelogLink}
          onChange={(e) => {
            setChangelogLink(e.target.value);
            handleInputChange();
          }}
          onBlur={handleInputChange}
        />
      </div>
    </div>
  );
};

export default InputChangelog;
