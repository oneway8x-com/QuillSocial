import UnsplashImageSelector from "../write/UnsplashImageSelector";
import { useLocale } from "@quillsocial/lib/hooks/useLocale";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  ImageUploader,
  Input,
  Button,
  showToast,
} from "@quillsocial/ui";
import { Upload } from "@quillsocial/ui/components/icon";
import { result } from "lodash";
import { Check } from "lucide-react";
import NextImage from "next/image";
import { useState } from "react";
import { useImageUpload, ImageSourceType } from "../../lib/image-upload";

interface AddImageDialogProps {
  open: boolean;
  onClose: () => void;
  handleImageChange: (imageSrc: string, cloudFileId?: number) => Promise<void>;
}

enum SourceType {
  Upload = "upload",
  Unsplash = "unsplash",
  Embed = "embed",
}

export const AddImageDialog: React.FC<AddImageDialogProps> = ({
  open,
  onClose,
  handleImageChange,
}) => {
  const [activeTab, setActiveTab] = useState(SourceType.Upload);
  const { t } = useLocale();
  const {
    imageSrc,
    cloudFileId,
    isLoading,
    handleImageUpload,
    handleUnsplashImage,
    handleEmbedImage,
    clearImage,
  } = useImageUpload();

  const [imagesUnsplash, setImagesUnsplash] = useState([]);
  const [searchImage, setSearchImage] = useState("");
  const [searchLink, setSearchLink] = useState("");
  const [isButtonSearchImage, setIsButtonSearchImage] = useState(false);
  const [showUnsplashModal, setShowUnsplashModal] = useState(false);

  const handleSearchImagesUnsplash = async () => {
    if (!searchImage) {
      showToast("Please enter keywords", "error");
      return;
    }
    setIsButtonSearchImage(true);
    const response = await fetch(
      `/api/image/getImageUnplash?key=${searchImage}`,
      {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (response.ok) {
      const data = await response.json();
      setImagesUnsplash(data.imageDetails);
      setShowUnsplashModal(true);
      setIsButtonSearchImage(false);
    } else {
      showToast(
        "Error while searching image, please try other keywords",
        "error"
      );
    }
    setIsButtonSearchImage(false);
  };

  const handleImageUnsplashResult = async (imageUrl: string) => {
    await handleUnsplashImage(imageUrl);
    setShowUnsplashModal(false);
  };

  const handleConvertLinkUrlToImage = async () => {
    await handleEmbedImage(searchLink);
  };

  const handleChangeTab = (tab: SourceType) => {
    setActiveTab(tab);
    clearData();
  };

  function clearData() {
    clearImage();
    setImagesUnsplash([]);
    setSearchImage("");
    setSearchLink("");
  }

  return (
    <Dialog open={open}>
      <DialogContent className="w-full max-w-xl">
        <div className="flex w-full justify-end">
          <div
            onClick={() => {
              clearData();
              onClose();
            }}
            className="mr-[-23px] mt-[-25px] flex h-[40px] w-[40px] items-center justify-center rounded-full border-none bg-white text-center text-red-700 hover:cursor-pointer hover:border-none hover:bg-red-100 focus:border-none"
          >
            &times;
          </div>
        </div>
        <div className="flex gap-5 border-b font-bold">
          <button
            className={`flex py-2 ${
              activeTab === SourceType.Upload
                ? "border-b-2 border-blue-500 text-blue-500"
                : ""
            }`}
            onClick={() => handleChangeTab(SourceType.Upload)}
          >
            Upload Image
          </button>
          <button
            className={`flex py-2 ${
              activeTab === SourceType.Unsplash
                ? "border-b-2 border-blue-500 text-blue-500"
                : ""
            }`}
            onClick={() => handleChangeTab(SourceType.Unsplash)}
          >
            Search Unsplash
          </button>
          <button
            className={`flex py-2 ${
              activeTab === SourceType.Embed
                ? "border-b-2 border-blue-500 text-blue-500"
                : ""
            }`}
            onClick={() => handleChangeTab(SourceType.Embed)}
          >
            Embed Link
          </button>
        </div>
        <div className="mt-4">
          {activeTab === SourceType.Upload && (
            <>
              <span className="mb-2 block text-sm font-semibold text-gray-700">
                Upload Image from Computer
              </span>
              <div className="flex flex-col items-center justify-center rounded-lg  border border-gray-300 bg-slate-50 p-4">
                {/* <Button className="mb-2 hover:text-white text-dark bg-slate-50"><Upload /> </Button> */}
                <ImageUploader
                  className=""
                  target="Image"
                  id="avatar-upload"
                  disableCropTool={true}
                  buttonMsg={<Upload />}
                  handleImageChange={async (imgeDataUrl) => {
                    await handleImageUpload(imgeDataUrl, 'uploaded-image.jpg');
                  }}
                  imageSrc={imageSrc}
                />
                <span className="text-awst m-2 block  text-xs font-bold">
                  Click to Upload
                </span>
                <span className="block text-xs text-gray-500">
                  SVG, PNG, JPG or GIF (The maximum size per file is 10MB)
                </span>
              </div>
            </>
          )}
          {activeTab === SourceType.Unsplash && (
            <div className="mb-2  p-2">
              <p className="text-sm font-semibold text-gray-700">
                Search Unsplash for free images
              </p>
              <div className="relative mt-2 text-gray-600">
                <Input
                  className="border border-gray-300 bg-white pr-16 text-sm focus:outline-none"
                  type="search"
                  name="search"
                  placeholder="Search for an image..."
                  value={searchImage}
                  onChange={(event: any) => {
                    setSearchImage(event.target.value);
                  }}
                  onKeyDown={(event: any) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSearchImagesUnsplash();
                    }
                  }}
                />
                <div className="">
                  {showUnsplashModal && (
                    <UnsplashImageSelector
                      data={imagesUnsplash}
                      isOpen={showUnsplashModal}
                      onSelectImage={(imageUrl) =>
                        handleImageUnsplashResult(imageUrl)
                      }
                      onClose={() => setShowUnsplashModal(false)}
                    />
                  )}
                </div>
                <Button
                  disabled={isButtonSearchImage}
                  type="submit"
                  onClick={handleSearchImagesUnsplash}
                  className="absolute right-0 top-0 text-white"
                >
                  <svg
                    className="h-4 w-4 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                    version="1.1"
                    id="Capa_1"
                    x="0px"
                    y="0px"
                    viewBox="0 0 56.966 56.966"
                    width="512px"
                    height="512px"
                  >
                    <path d="M55.146 51.887l-13.56-13.56c3.746-4.286 5.984-9.96 5.984-16.107C47.57 9.947 36.624-1 22.785-1 8.947-1-2 9.947-2 22.785c0 12.84 11.947 23.787 24.785 23.787 6.147 0 11.821-2.238 16.107-5.984l13.56 13.56c0.977 0.977 2.256 1.465 3.536 1.465s2.56-0.488 3.536-1.465C57.1 57.007 57.1 53.841 55.146 51.887zM22.785 40.572c-9.823 0-17.787-7.963-17.787-17.787s7.964-17.787 17.787-17.787c9.824 0 17.787 7.963 17.787 17.787S32.609 40.572 22.785 40.572z" />
                  </svg>
                </Button>
              </div>
            </div>
          )}
          {activeTab === SourceType.Embed && (
            <div className="mb-2 block p-2">
              <p className="text-sm font-semibold text-gray-700">
                Paste the image link below
              </p>
              <div className="relative mt-2 text-gray-600">
                <Input
                  className="border border-gray-300 bg-white pr-16 text-sm focus:outline-none"
                  value={searchLink}
                  onChange={(event: any) => setSearchLink(event.target.value)}
                  placeholder="https://..."
                  onKeyDown={(event: any) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleConvertLinkUrlToImage();
                    }
                  }}
                />
                <Button
                  type="submit"
                  onClick={handleConvertLinkUrlToImage}
                  className="absolute right-0 top-0 text-white"
                >
                  <Check />
                </Button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-center">
            {imageSrc && (
              <NextImage
                className="m-2"
                alt="Image"
                width={0}
                height={0}
                sizes="100vw"
                src={imageSrc}
                style={{ width: "auto", height: "250px" }}
              ></NextImage>
            )}
          </div>
        </div>
        <DialogFooter className="flex justify-end">
          <Button
            className="rounded-xl"
            disabled={!imageSrc || isLoading}
            onClick={async () => {
              await handleImageChange(imageSrc, cloudFileId);
              clearImage();
            }}
          >
            {isLoading ? "Uploading..." : "Use this Image"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
