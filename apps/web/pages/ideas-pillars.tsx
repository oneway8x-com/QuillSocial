import PageWrapper from "@components/PageWrapper";
import { OutlineDrawer, PillarManager } from "@components/ideas-pillars";
import type { Idea, Outline } from "@components/ideas-pillars/types";
import Shell from "@quillsocial/features/shell/Shell";
import { useLocale } from "@quillsocial/lib/hooks/useLocale";
import { trpc } from "@quillsocial/trpc/react";
import {
  Button,
  HeadSeo,
  Badge,
  showToast,
  Dialog,
  DialogContent,
  DialogTrigger,
  TextArea,
  Label,
} from "@quillsocial/ui";
import {
  Plus,
  Star,
  Trash2,
  ChevronDown,
  Loader2,
  Settings,
  Edit2,
} from "@quillsocial/ui/components/icon";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

function IdeasPillarsPage() {
  const { t } = useLocale();
  const router = useRouter();
  const utils = trpc.useContext();

  // State
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [openOutlineForIdeaId, setOpenOutlineForIdeaId] = useState<string | null>(null);
  const [addIdeaOpen, setAddIdeaOpen] = useState(false);
  const [managePillarsOpen, setManagePillarsOpen] = useState(false);
  const [newIdeaTitle, setNewIdeaTitle] = useState("");
  const [editIdeaOpen, setEditIdeaOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<{ id: string; title: string } | null>(null);

  // Queries
  const { data: pillars = [], isLoading: pillarsLoading } = trpc.viewer.ideasPillars.listPillars.useQuery();
  const { data: ideas = [], isLoading: ideasLoading } = trpc.viewer.ideasPillars.listIdeas.useQuery({
    pillarId: selectedPillar || undefined,
  });

  // Mutations
  const createIdeaMutation = trpc.viewer.ideasPillars.createIdea.useMutation({
    onSuccess: () => {
      utils.viewer.ideasPillars.listIdeas.invalidate();
      showToast("Idea created successfully", "success");
      setAddIdeaOpen(false);
      setNewIdeaTitle("");
    },
    onError: (error) => {
      showToast(error.message || "Failed to create idea", "error");
    },
  });

  const deleteIdeaMutation = trpc.viewer.ideasPillars.deleteIdea.useMutation({
    onSuccess: () => {
      utils.viewer.ideasPillars.listIdeas.invalidate();
      showToast("Idea deleted successfully", "success");
      if (selectedIdea && selectedIdea.id === selectedIdea.id) {
        setSelectedIdea(null);
      }
    },
    onError: (error) => {
      showToast(error.message || "Failed to delete idea", "error");
    },
  });

  const updateIdeaMutation = trpc.viewer.ideasPillars.updateIdea.useMutation({
    onSuccess: () => {
      utils.viewer.ideasPillars.listIdeas.invalidate();
      showToast("Idea updated successfully", "success");
      setEditIdeaOpen(false);
      setEditingIdea(null);
    },
    onError: (error) => {
      showToast(error.message || "Failed to update idea", "error");
    },
  });

  const saveOutlineMutation = trpc.viewer.ideasPillars.saveOutline.useMutation({
    onSuccess: () => {
      utils.viewer.ideasPillars.listIdeas.invalidate();
      showToast("Outline saved successfully", "success");
    },
    onError: (error) => {
      showToast(error.message || "Failed to save outline", "error");
    },
  });

  const generateOutlineMutation = trpc.viewer.ideasPillars.generateOutline.useMutation({
    onError: (error) => {
      showToast(error.message || "Failed to generate outline", "error");
    },
  });

  // Set initial pillar when pillars load
  useEffect(() => {
    if (pillars.length > 0 && !selectedPillar) {
      setSelectedPillar(pillars[0].id);
    }
  }, [pillars, selectedPillar]);

  const handleSelectIdea = (idea: any) => {
    const mappedIdea: Idea = {
      id: idea.id,
      title: idea.title,
      pillar: idea.pillar.name,
      status: idea.status === "OUTLINED" ? "Outlined" : "Raw",
      tags: idea.tags,
    };
    setSelectedIdea(mappedIdea);
  };

  const handleExpandToOutline = () => {
    if (selectedIdea) {
      setOpenOutlineForIdeaId(selectedIdea.id);
    }
  };

  const handlePromoteToPost = (idea: Idea) => {
    // Navigate to post factory with the idea ID
    router.push({
      pathname: "/post-factory",
      query: { ideaId: idea.id },
    });
    showToast("Navigating to Post Factory...", "success");
  };

  const handleSaveOutline = (outline: Outline) => {
    saveOutlineMutation.mutate({
      ideaId: outline.ideaId,
      text: outline.text,
      tone: outline.metadata.tone.toUpperCase() as "FRIENDLY" | "AUTHORITATIVE" | "CONTRARIAN",
    });
    setOpenOutlineForIdeaId(null);
  };

  const handleCloseOutlineDrawer = () => {
    setOpenOutlineForIdeaId(null);
  };

  const handleGenerateOutline = async (ideaId: string, tone: "friendly" | "authoritative" | "contrarian") => {
    const toneUppercase = tone.toUpperCase() as "FRIENDLY" | "AUTHORITATIVE" | "CONTRARIAN";
    const result = await generateOutlineMutation.mutateAsync({
      ideaId,
      tone: toneUppercase,
    });
    return result;
  };

  const handleCreateIdea = () => {
    if (!selectedPillar) {
      showToast("Please select a pillar first", "error");
      return;
    }
    if (!newIdeaTitle.trim()) {
      showToast("Please enter an idea title", "error");
      return;
    }
    createIdeaMutation.mutate({
      pillarId: selectedPillar,
      title: newIdeaTitle.trim(),
      tags: [],
    });
  };

  const handleDeleteIdea = (ideaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this idea?")) {
      deleteIdeaMutation.mutate({ id: ideaId });
    }
  };

  const handleEditIdea = (idea: { id: string; title: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingIdea(idea);
    setEditIdeaOpen(true);
  };

  const handleUpdateIdea = () => {
    if (!editingIdea) return;
    if (!editingIdea.title.trim()) {
      showToast("Please enter an idea title", "error");
      return;
    }
    updateIdeaMutation.mutate({
      id: editingIdea.id,
      title: editingIdea.title.trim(),
    });
  };

  // Get current outline for drawer
  const currentOutlineIdea = ideas.find((idea) => idea.id === openOutlineForIdeaId);
  const currentOutline = currentOutlineIdea?.outline
    ? {
        id: currentOutlineIdea.outline.id,
        ideaId: currentOutlineIdea.id,
        text: currentOutlineIdea.outline.text,
        metadata: {
          tone: currentOutlineIdea.outline.tone.toLowerCase() as "friendly" | "authoritative" | "contrarian",
        },
      }
    : null;

  const currentOutlineIdeaMapped = currentOutlineIdea
    ? {
        id: currentOutlineIdea.id,
        title: currentOutlineIdea.title,
        pillar: currentOutlineIdea.pillar.name,
        status: currentOutlineIdea.status === "OUTLINED" ? "Outlined" as const : "Raw" as const,
        tags: currentOutlineIdea.tags,
      }
    : null;

  return (
    <>
      <HeadSeo title={t("Ideas & Pillars")} description={t("Organize your content ideas")} />

      <Shell withoutSeo heading={t("Ideas & Pillars")} subtitle="Drop a note, link, or reply. We'll shape it.">
        <div className="mt-5">
          {/* Header with Add Idea button */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Ideas & Pillars</h2>
              <p className="mt-1 text-sm text-gray-600">Drop a note, link, or reply. We'll shape it.</p>
            </div>
            <Dialog open={addIdeaOpen} onOpenChange={setAddIdeaOpen}>
              <DialogTrigger asChild>
                <Button
                  color="primary"
                  StartIcon={Plus}
                  className="rounded-lg px-4 py-2 text-white shadow-lg"
                  disabled={!selectedPillar}
                >
                  Add Idea
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="idea-title">Idea Title</Label>
                    <TextArea
                      id="idea-title"
                      value={newIdeaTitle}
                      onChange={(e) => setNewIdeaTitle(e.target.value)}
                      placeholder="Enter your idea..."
                      className="mt-2 min-h-[100px] rounded-md border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button color="minimal" onClick={() => setAddIdeaOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      color="primary"
                      onClick={handleCreateIdea}
                      disabled={createIdeaMutation.isLoading}
                    >
                      {createIdeaMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {pillarsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-6">
              {/* Left column - Ideas List */}
              <div className="col-span-12 lg:col-span-8">
                {/* Pillar Tabs */}
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  {pillars.length === 0 ? (
                    <div className="w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                      <p className="mb-4 text-gray-600">No pillars yet. Create your content pillars to get started.</p>
                      <Button
                        color="primary"
                        StartIcon={Plus}
                        onClick={() => setManagePillarsOpen(true)}
                      >
                        Manage Pillars
                      </Button>
                    </div>
                  ) : (
                    <>
                      {pillars.map((pillar) => (
                        <button
                          key={pillar.id}
                          onClick={() => setSelectedPillar(pillar.id)}
                          className={`${
                            selectedPillar === pillar.id
                              ? pillar.color + " text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          } rounded-full px-4 py-2 text-sm font-medium transition-colors`}
                        >
                          {pillar.name}
                          <span className="ml-2 text-xs opacity-75">({pillar._count.ideas})</span>
                        </button>
                      ))}
                      <button
                        onClick={() => setManagePillarsOpen(true)}
                        className="flex items-center gap-1 rounded-full border-2 border-dashed border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                      >
                        <Settings className="h-4 w-4" />
                        Manage
                      </button>
                    </>
                  )}
                </div>

                {/* Ideas Cards */}
                {ideasLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ideas.map((idea) => (
                      <div
                        key={idea.id}
                        onClick={() => handleSelectIdea(idea)}
                        className={`cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
                          selectedIdea?.id === idea.id ? "ring-2 ring-indigo-600" : "border-gray-200"
                        }`}
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={idea.pillar.name === "Build in Public" ? "blue" : idea.pillar.name === "Founder Lessons" ? "default" : "success"}
                              size="sm"
                            >
                              {idea.pillar.name}
                            </Badge>
                            <Badge variant="gray" size="sm">
                              {idea.status === "OUTLINED" ? "Outlined" : "Raw"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                              <Star className="h-4 w-4" />
                            </button>
                            <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => handleEditIdea({ id: idea.id, title: idea.title }, e)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteIdea(idea.id, e)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                              disabled={deleteIdeaMutation.isLoading}
                            >
                              {deleteIdeaMutation.isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <h3 className="text-base font-medium text-gray-900">{idea.title}</h3>
                        {idea.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {idea.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {ideas.length === 0 && (
                      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                        <p className="text-gray-500">No ideas in this pillar yet.</p>
                        <Button
                          color="primary"
                          StartIcon={Plus}
                          className="mt-4"
                          onClick={() => setAddIdeaOpen(true)}
                        >
                          Add First Idea
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right column - Selected Idea Details */}
              <div className="col-span-12 lg:col-span-4">
                {selectedIdea ? (
                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Selected Idea</h3>

                    <div className="mb-6">
                      <h4 className="mb-2 text-sm font-medium text-gray-700">Content</h4>
                      <p className="text-sm text-gray-900">{selectedIdea.title}</p>
                    </div>

                    <div className="mb-6">
                      <h4 className="mb-2 text-sm font-medium text-gray-700">Status</h4>
                      <Badge variant="gray">{selectedIdea.status}</Badge>
                    </div>

                    {selectedIdea.tags.length > 0 && (
                      <div className="mb-6">
                        <h4 className="mb-2 text-sm font-medium text-gray-700">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedIdea.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <Button
                        color="primary"
                        StartIcon={Star}
                        onClick={handleExpandToOutline}
                        className="w-full justify-center"
                      >
                        Expand to Outline
                      </Button>
                      <Button
                        color="secondary"
                        onClick={() => selectedIdea && handlePromoteToPost(selectedIdea)}
                        className="w-full justify-center"
                      >
                        Promote to Post
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                    <p className="text-sm text-gray-500">Select an idea to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Outline Drawer */}
        <OutlineDrawer
          open={openOutlineForIdeaId !== null}
          idea={currentOutlineIdeaMapped}
          existingOutline={currentOutline}
          onSave={handleSaveOutline}
          onPromote={handlePromoteToPost}
          onClose={handleCloseOutlineDrawer}
          onGenerate={handleGenerateOutline}
          isGenerating={generateOutlineMutation.isLoading}
        />

        {/* Pillar Manager Dialog */}
        <Dialog open={managePillarsOpen} onOpenChange={setManagePillarsOpen}>
          <DialogContent className="sm:max-w-2xl">
            <PillarManager
              onPillarChange={() => {
                utils.viewer.ideasPillars.listPillars.invalidate();
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Idea Dialog */}
        <Dialog open={editIdeaOpen} onOpenChange={setEditIdeaOpen}>
          <DialogContent className="sm:max-w-md">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Edit Idea</h3>
              </div>
              <div>
                <Label htmlFor="edit-idea-title">Idea Title</Label>
                <TextArea
                  id="edit-idea-title"
                  value={editingIdea?.title || ""}
                  onChange={(e) => setEditingIdea(editingIdea ? { ...editingIdea, title: e.target.value } : null)}
                  placeholder="Enter your idea..."
                  className="mt-2 min-h-[100px] rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button color="minimal" onClick={() => setEditIdeaOpen(false)}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onClick={handleUpdateIdea}
                  disabled={updateIdeaMutation.isLoading}
                >
                  {updateIdeaMutation.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Shell>
    </>
  );
}

IdeasPillarsPage.PageWrapper = PageWrapper;
export default IdeasPillarsPage;
