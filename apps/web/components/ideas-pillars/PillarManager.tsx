import { trpc } from "@quillsocial/trpc/react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTrigger,
  Label,
  TextField,
  showToast,
} from "@quillsocial/ui";
import { Plus, Trash2, Loader2 } from "@quillsocial/ui/components/icon";
import React, { useState } from "react";

const PILLAR_COLORS = [
  { value: "bg-indigo-600", label: "Indigo", preview: "bg-indigo-600" },
  { value: "bg-cyan-500", label: "Cyan", preview: "bg-cyan-500" },
  { value: "bg-green-600", label: "Green", preview: "bg-green-600" },
  { value: "bg-orange-500", label: "Orange", preview: "bg-orange-500" },
  { value: "bg-purple-600", label: "Purple", preview: "bg-purple-600" },
  { value: "bg-pink-500", label: "Pink", preview: "bg-pink-500" },
  { value: "bg-red-600", label: "Red", preview: "bg-red-600" },
  { value: "bg-blue-600", label: "Blue", preview: "bg-blue-600" },
];

interface PillarManagerProps {
  onPillarChange?: () => void;
}

export function PillarManager({ onPillarChange }: PillarManagerProps) {
  const utils = trpc.useContext();
  const [addPillarOpen, setAddPillarOpen] = useState(false);
  const [newPillarName, setNewPillarName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PILLAR_COLORS[0].value);

  const { data: pillars = [], isLoading } = trpc.viewer.ideasPillars.listPillars.useQuery();

  const initPillarsMutation = trpc.viewer.ideasPillars.initPillars.useMutation({
    onSuccess: (data) => {
      utils.viewer.ideasPillars.listPillars.invalidate();
      showToast(`${data.created} default pillars created`, "success");
      onPillarChange?.();
    },
    onError: (error) => {
      showToast(error.message || "Failed to initialize pillars", "error");
    },
  });

  const createPillarMutation = trpc.viewer.ideasPillars.createPillar.useMutation({
    onSuccess: () => {
      utils.viewer.ideasPillars.listPillars.invalidate();
      showToast("Pillar created successfully", "success");
      setAddPillarOpen(false);
      setNewPillarName("");
      setSelectedColor(PILLAR_COLORS[0].value);
      onPillarChange?.();
    },
    onError: (error) => {
      showToast(error.message || "Failed to create pillar", "error");
    },
  });

  const deletePillarMutation = trpc.viewer.ideasPillars.deletePillar.useMutation({
    onSuccess: () => {
      utils.viewer.ideasPillars.listPillars.invalidate();
      showToast("Pillar deleted successfully", "success");
      onPillarChange?.();
    },
    onError: (error) => {
      showToast(error.message || "Failed to delete pillar", "error");
    },
  });

  const handleInitPillars = () => {
    if (confirm("This will create 4 default pillars (Build in Public, Founder Lessons, Client Wins, Playbooks). Continue?")) {
      initPillarsMutation.mutate();
    }
  };

  const handleCreatePillar = () => {
    if (!newPillarName.trim()) {
      showToast("Please enter a pillar name", "error");
      return;
    }
    createPillarMutation.mutate({
      name: newPillarName.trim(),
      color: selectedColor,
    });
  };

  const handleDeletePillar = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the pillar "${name}"? This will not delete associated ideas.`)) {
      deletePillarMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Manage Pillars</h3>
        <div className="flex gap-2">
          {pillars.length === 0 && (
            <Button
              color="secondary"
              size="sm"
              onClick={handleInitPillars}
              disabled={initPillarsMutation.isLoading}
            >
              {initPillarsMutation.isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Init Default Pillars
            </Button>
          )}
          <Dialog open={addPillarOpen} onOpenChange={setAddPillarOpen}>
            <DialogTrigger asChild>
              <Button color="primary" size="sm" StartIcon={Plus}>
                Add Pillar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Add New Pillar</h3>
                  <p className="text-sm text-gray-600">Create a new content pillar</p>
                </div>
                <div>
                  <Label htmlFor="pillar-name">Pillar Name</Label>
                  <TextField
                    id="pillar-name"
                    value={newPillarName}
                    onChange={(e) => setNewPillarName(e.target.value)}
                    placeholder="e.g., Marketing Tips"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {PILLAR_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setSelectedColor(color.value)}
                        className={`flex items-center justify-center rounded-lg border-2 p-3 transition-all ${
                          selectedColor === color.value
                            ? "border-indigo-600 ring-2 ring-indigo-600 ring-offset-2"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className={`h-6 w-6 rounded ${color.preview}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button color="minimal" onClick={() => setAddPillarOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    onClick={handleCreatePillar}
                    disabled={createPillarMutation.isLoading}
                  >
                    {createPillarMutation.isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {pillars.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-500">
            No pillars yet. Initialize default pillars or create your own.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pillars.map((pillar) => (
            <div
              key={pillar.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${pillar.color}`} />
                <span className="font-medium text-gray-900">{pillar.name}</span>
                <span className="text-sm text-gray-500">({pillar._count.ideas} ideas)</span>
              </div>
              <Button
                color="minimal"
                size="sm"
                onClick={() => handleDeletePillar(pillar.id, pillar.name)}
                disabled={deletePillarMutation.isLoading}
              >
                {deletePillarMutation.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
