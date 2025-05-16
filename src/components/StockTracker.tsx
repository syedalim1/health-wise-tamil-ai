import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  PackageOpen,
  Search,
  Filter,
  Plus,
  Pill,
  CheckCircle2,
  X,
  Edit2,
  PlusCircle,
  MinusCircle,
  Info,
  ArrowUpDown,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Language,
  getLanguageStrings,
  formatString,
} from "@/utils/languageUtils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StockTrackerProps {
  language: Language;
}

interface MedicationStock {
  id: string;
  name: string;
  count: number;
  lowStockThreshold: number;
  category: string;
  dosage?: string;
  notes?: string;
  lastUpdated: Date;
}

type SortField = "name" | "count" | "category" | "lastUpdated";
type SortDirection = "asc" | "desc";

const categories = [
  { id: "all", label: "All Categories" },
  { id: "pain", label: "Pain Relief" },
  { id: "antibiotic", label: "Antibiotics" },
  { id: "vitamin", label: "Vitamins & Supplements" },
  { id: "allergy", label: "Allergy" },
  { id: "heart", label: "Cardiovascular" },
  { id: "diabetes", label: "Diabetes" },
  { id: "other", label: "Other" },
];

const StockTracker: React.FC<StockTrackerProps> = ({ language }) => {
  const strings = getLanguageStrings(language);
  const [medicationStocks, setMedicationStocks] = useState<MedicationStock[]>(
    []
  );
  const [filteredStocks, setFilteredStocks] = useState<MedicationStock[]>([]);
  const [newMedicationName, setNewMedicationName] = useState("");
  const [newMedicationCount, setNewMedicationCount] = useState<number>(0);
  const [newMedicationThreshold, setNewMedicationThreshold] =
    useState<number>(3);
  const [newMedicationCategory, setNewMedicationCategory] =
    useState<string>("other");
  const [newMedicationDosage, setNewMedicationDosage] = useState<string>("");
  const [newMedicationNotes, setNewMedicationNotes] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingMedication, setEditingMedication] = useState<string | null>(
    null
  );
  const [isAddFormExpanded, setIsAddFormExpanded] = useState<boolean>(false);
  const [sortField, setSortField] = useState<SortField>("count");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentTab, setCurrentTab] = useState<"all" | "low">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Load from localStorage on initial render
  useEffect(() => {
    const savedStocks = localStorage.getItem("medicationStocks");
    if (savedStocks) {
      try {
        const parsed = JSON.parse(savedStocks);
        // Convert string dates to Date objects
        const stocks = parsed.map((stock: any) => ({
          ...stock,
          lastUpdated: new Date(stock.lastUpdated || Date.now()),
        }));
        setMedicationStocks(stocks);
      } catch (e) {
        console.error("Error loading medication stocks from localStorage", e);
      }
    }
  }, []);

  // Apply filtering and sorting when dependencies change
  useEffect(() => {
    let filtered = [...medicationStocks];

    // Filter by tab selection (All or Low Stock)
    if (currentTab === "low") {
      filtered = filtered.filter((med) => med.count <= med.lowStockThreshold);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (med) =>
          med.name.toLowerCase().includes(query) ||
          (med.notes && med.notes.toLowerCase().includes(query)) ||
          (med.dosage && med.dosage.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((med) => med.category === categoryFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareA, compareB;

      switch (sortField) {
        case "name":
          compareA = a.name.toLowerCase();
          compareB = b.name.toLowerCase();
          break;
        case "count":
          compareA = a.count;
          compareB = b.count;
          break;
        case "category":
          compareA = a.category;
          compareB = b.category;
          break;
        case "lastUpdated":
          compareA = a.lastUpdated.getTime();
          compareB = b.lastUpdated.getTime();
          break;
        default:
          compareA = a.count;
          compareB = b.count;
      }

      if (compareA < compareB) return sortDirection === "asc" ? -1 : 1;
      if (compareA > compareB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredStocks(filtered);
  }, [
    medicationStocks,
    searchQuery,
    categoryFilter,
    sortField,
    sortDirection,
    currentTab,
  ]);

  // Save to localStorage when stocks change
  useEffect(() => {
    localStorage.setItem("medicationStocks", JSON.stringify(medicationStocks));
  }, [medicationStocks]);

  const resetForm = () => {
    setNewMedicationName("");
    setNewMedicationCount(0);
    setNewMedicationThreshold(3);
    setNewMedicationCategory("other");
    setNewMedicationDosage("");
    setNewMedicationNotes("");
    setIsAddFormExpanded(false);
  };

  const handleAddMedication = () => {
    if (!newMedicationName || newMedicationCount < 0) {
      toast.error("Please provide a medication name and valid count");
      return;
    }

    const newMedication: MedicationStock = {
      id: Date.now().toString(),
      name: newMedicationName,
      count: newMedicationCount,
      lowStockThreshold: newMedicationThreshold,
      category: newMedicationCategory,
      dosage: newMedicationDosage || undefined,
      notes: newMedicationNotes || undefined,
      lastUpdated: new Date(),
    };

    setMedicationStocks([...medicationStocks, newMedication]);
    toast.success(`${newMedicationName} added to your stock tracker`);
    resetForm();
  };

  const handleUpdateCount = (id: string, newCount: number) => {
    setMedicationStocks(
      medicationStocks.map((med) =>
        med.id === id
          ? { ...med, count: newCount, lastUpdated: new Date() }
          : med
      )
    );
  };

  const handleQuickIncrement = (id: string) => {
    const medication = medicationStocks.find((med) => med.id === id);
    if (medication) {
      handleUpdateCount(id, medication.count + 1);
      toast.success(`Added 1 to ${medication.name}`);
    }
  };

  const handleQuickDecrement = (id: string) => {
    const medication = medicationStocks.find((med) => med.id === id);
    if (medication && medication.count > 0) {
      handleUpdateCount(id, medication.count - 1);
      toast.success(`Removed 1 from ${medication.name}`);
    }
  };

  const handleDeleteMedication = (id: string) => {
    const medication = medicationStocks.find((med) => med.id === id);
    setMedicationStocks(medicationStocks.filter((med) => med.id !== id));
    if (medication) {
      toast.success(`${medication.name} removed from your stock`);
    }
  };

  const handleSaveEdit = (id: string, updates: Partial<MedicationStock>) => {
    setMedicationStocks(
      medicationStocks.map((med) =>
        med.id === id ? { ...med, ...updates, lastUpdated: new Date() } : med
      )
    );
    setEditingMedication(null);
    toast.success("Medication updated successfully");
  };

  const getLowStockMedications = () => {
    return medicationStocks.filter((med) => med.count <= med.lowStockThreshold);
  };

  const lowStockCount = getLowStockMedications().length;

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if clicking on the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getStockLevelClass = (medication: MedicationStock) => {
    const ratio = medication.count / medication.lowStockThreshold;
    if (ratio <= 0.5) return "bg-red-500";
    if (ratio <= 1) return "bg-amber-500";
    if (ratio <= 2) return "bg-yellow-400";
    return "bg-green-500";
  };

  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? "↑" : "↓";
  };

  return (
    <div className="space-y-4 p-4 md:p-5">
      <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
        <Pill className="h-6 w-6 text-health-primary" />
        {strings.stockTracker}
        {lowStockCount > 0 && (
          <Badge variant="destructive" className="ml-2">
            {lowStockCount}{" "}
            {lowStockCount === 1 ? strings.itemLowStock : strings.itemsLowStock}
          </Badge>
        )}
      </h2>

      {lowStockCount > 0 && (
        <Alert className="bg-red-50 border-red-200 text-red-800">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-700">
            {lowStockCount === 1
              ? "1 medication is running low"
              : `${lowStockCount} medications are running low`}
          </AlertTitle>
          <AlertDescription className="text-sm text-red-600">
            {getLowStockMedications()
              .slice(0, 3)
              .map((med) => med.name)
              .join(", ")}
            {lowStockCount > 3 && ` and ${lowStockCount - 3} more`}
          </AlertDescription>
        </Alert>
      )}

      <Card className="card-health border-health-light">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">{strings.stockTracker}</CardTitle>
              <CardDescription>{strings.stockTrackerDesc}</CardDescription>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Tabs
                value={currentTab}
                onValueChange={(v) => setCurrentTab(v as "all" | "low")}
                className="w-[180px]"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="low">
                    Low Stock
                    {lowStockCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="ml-1 h-5 min-w-[20px] px-1 text-xs"
                      >
                        {lowStockCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="relative flex-grow sm:flex-grow-0 w-full sm:w-auto max-w-xs">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-8 w-full"
                  placeholder={strings.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={strings.filterByCategory} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!isAddFormExpanded ? (
              <Button
                onClick={() => setIsAddFormExpanded(true)}
                className="w-full md:w-auto bg-health-primary hover:bg-health-primary/90 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {strings.addNewMedication}
              </Button>
            ) : (
              <Card className="border border-health-primary/20 bg-health-light/20 p-4">
                <CardTitle className="text-sm mb-3 flex items-center justify-between">
                  {strings.addNewMedication}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={resetForm}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="grid grid-cols-1 gap-3">
                      <Input
                        className="input-health"
                        placeholder={strings.medicationName}
                        value={newMedicationName}
                        onChange={(e) => setNewMedicationName(e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          className="input-health"
                          type="number"
                          min="0"
                          placeholder={strings.stockLeft}
                          value={newMedicationCount || ""}
                          onChange={(e) =>
                            setNewMedicationCount(parseInt(e.target.value) || 0)
                          }
                        />
                        <Input
                          className="input-health"
                          type="number"
                          min="1"
                          placeholder={strings.lowStockThreshold}
                          value={newMedicationThreshold || ""}
                          onChange={(e) =>
                            setNewMedicationThreshold(
                              parseInt(e.target.value) || 1
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <Select
                      value={newMedicationCategory}
                      onValueChange={setNewMedicationCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={strings.medicationCategory} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter((c) => c.id !== "all")
                          .map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        className="input-health"
                        placeholder={`${
                          strings.dosage
                        } (${strings.dosage.toLowerCase()})`}
                        value={newMedicationDosage}
                        onChange={(e) => setNewMedicationDosage(e.target.value)}
                      />
                      <Input
                        className="input-health"
                        placeholder={`${
                          strings.notes
                        } (${strings.notes.toLowerCase()})`}
                        value={newMedicationNotes}
                        onChange={(e) => setNewMedicationNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    onClick={handleAddMedication}
                    className="bg-health-primary hover:bg-health-primary/90"
                    disabled={!newMedicationName || newMedicationCount < 0}
                  >
                    {strings.save}
                  </Button>
                </div>
              </Card>
            )}

            {/* Sorting and View options */}
            {filteredStocks.length > 0 && (
              <div className="flex flex-wrap justify-between items-center py-2">
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-7 px-2 ${
                      sortField === "name" ? "text-health-primary" : ""
                    }`}
                    onClick={() => handleSort("name")}
                  >
                    Name {getSortIndicator("name")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-7 px-2 ${
                      sortField === "count" ? "text-health-primary" : ""
                    }`}
                    onClick={() => handleSort("count")}
                  >
                    Quantity {getSortIndicator("count")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-7 px-2 ${
                      sortField === "category" ? "text-health-primary" : ""
                    }`}
                    onClick={() => handleSort("category")}
                  >
                    Category {getSortIndicator("category")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-7 px-2 ${
                      sortField === "lastUpdated" ? "text-health-primary" : ""
                    }`}
                    onClick={() => handleSort("lastUpdated")}
                  >
                    Updated {getSortIndicator("lastUpdated")}
                  </Button>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setViewMode("grid")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="7" height="7" x="3" y="3" rx="1" />
                      <rect width="7" height="7" x="14" y="3" rx="1" />
                      <rect width="7" height="7" x="14" y="14" rx="1" />
                      <rect width="7" height="7" x="3" y="14" rx="1" />
                    </svg>
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setViewMode("list")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="3" x2="21" y1="6" y2="6" />
                      <line x1="3" x2="21" y1="12" y2="12" />
                      <line x1="3" x2="21" y1="18" y2="18" />
                    </svg>
                  </Button>
                </div>
              </div>
            )}

            {filteredStocks.length === 0 && medicationStocks.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                <PackageOpen className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">No medications added yet.</p>
              </div>
            ) : filteredStocks.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                <Search className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-gray-500">
                  No medications match your search criteria.
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStocks.map((medication) => (
                  <Card
                    key={medication.id}
                    className="overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div
                      className="h-1.5 w-full"
                      style={{
                        backgroundColor: getCategoryColor(medication.category),
                      }}
                    ></div>
                    <CardContent className="pt-4">
                      {editingMedication === medication.id ? (
                        <EditMedicationForm
                          medication={medication}
                          onSave={(updates) =>
                            handleSaveEdit(medication.id, updates)
                          }
                          onCancel={() => setEditingMedication(null)}
                        />
                      ) : (
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-1">
                                <h3 className="font-medium text-lg">
                                  {medication.name}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                  {getCategoryName(medication.category)}
                                </Badge>
                              </div>
                              {medication.dosage && (
                                <p className="text-xs text-gray-500">
                                  {medication.dosage}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-gray-400 hover:text-health-primary"
                                      onClick={() =>
                                        setEditingMedication(medication.id)
                                      }
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {strings.editMedication}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-gray-400 hover:text-health-danger"
                                      onClick={() =>
                                        handleDeleteMedication(medication.id)
                                      }
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {strings.deleteMedication}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>

                          <div className="mt-3">
                            <p className="text-sm mb-1">{strings.stockLeft}:</p>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${getStockLevelClass(
                                    medication
                                  )}`}
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (medication.count /
                                        (medication.lowStockThreshold * 3)) *
                                        100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                              <div className="flex items-center">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-7 p-0 rounded-full"
                                        onClick={() =>
                                          handleQuickDecrement(medication.id)
                                        }
                                        disabled={medication.count <= 0}
                                      >
                                        <span>-</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {strings.quickRemove}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <span className="mx-2 w-10 text-center font-medium">
                                  {medication.count}
                                </span>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 w-7 p-0 rounded-full"
                                        onClick={() =>
                                          handleQuickIncrement(medication.id)
                                        }
                                      >
                                        <span>+</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {strings.quickAdd}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </div>

                          {medication.count <= medication.lowStockThreshold && (
                            <Alert className="mt-3 py-2 px-3 bg-red-50 border-red-100">
                              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                              <AlertDescription className="text-xs text-red-600 ml-1">
                                {strings.refillNeeded}! {strings.stockLeft}:{" "}
                                {medication.count}{" "}
                                {medication.count === 1 ? "dose" : "doses"}.
                              </AlertDescription>
                            </Alert>
                          )}

                          {medication.notes && (
                            <p className="text-xs text-gray-500 mt-2">
                              {medication.notes}
                            </p>
                          )}

                          <p className="text-xs text-gray-400 mt-2">
                            {strings.lastUpdated}:{" "}
                            {formatDate(medication.lastUpdated)}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="border rounded-md divide-y">
                {filteredStocks.map((medication) => (
                  <div
                    key={medication.id}
                    className="p-3 hover:bg-gray-50 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-1 rounded-full"
                        style={{
                          backgroundColor: getCategoryColor(
                            medication.category
                          ),
                        }}
                      ></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{medication.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {getCategoryName(medication.category)}
                          </Badge>
                          {medication.count <= medication.lowStockThreshold && (
                            <Badge variant="destructive" className="text-xs">
                              {strings.refillNeeded}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {medication.dosage && (
                            <span>{medication.dosage}</span>
                          )}
                          <span>
                            {strings.lastUpdated}:{" "}
                            {formatDate(medication.lastUpdated)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-gray-100 rounded-full px-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-full"
                          onClick={() => handleQuickDecrement(medication.id)}
                          disabled={medication.count <= 0}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {medication.count}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-full"
                          onClick={() => handleQuickIncrement(medication.id)}
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-health-primary"
                        onClick={() => setEditingMedication(medication.id)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface EditMedicationFormProps {
  medication: MedicationStock;
  onSave: (updates: Partial<MedicationStock>) => void;
  onCancel: () => void;
}

const EditMedicationForm: React.FC<EditMedicationFormProps> = ({
  medication,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(medication.name);
  const [count, setCount] = useState(medication.count);
  const [threshold, setThreshold] = useState(medication.lowStockThreshold);
  const [category, setCategory] = useState(medication.category);
  const [dosage, setDosage] = useState(medication.dosage || "");
  const [notes, setNotes] = useState(medication.notes || "");

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">Edit Medication</p>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-health-primary"
            onClick={() =>
              onSave({
                name,
                count,
                lowStockThreshold: threshold,
                category,
                dosage,
                notes,
              })
            }
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Input
        className="input-health text-sm h-8"
        placeholder="Medication Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-2">
        <Input
          className="input-health text-sm h-8"
          type="number"
          min="0"
          placeholder="Current Count"
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value) || 0)}
        />
        <Input
          className="input-health text-sm h-8"
          type="number"
          min="1"
          placeholder="Low Stock Threshold"
          value={threshold}
          onChange={(e) => setThreshold(parseInt(e.target.value) || 1)}
        />
      </div>

      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="h-8 text-sm">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {categories
            .filter((c) => c.id !== "all")
            .map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.label}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      <div className="grid grid-cols-2 gap-2">
        <Input
          className="input-health text-sm h-8"
          placeholder="Dosage (optional)"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
        />
        <Input
          className="input-health text-sm h-8"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </div>
  );
};

// Helper function to get color based on category
function getCategoryColor(category: string): string {
  switch (category) {
    case "pain":
      return "#ef4444"; // red
    case "antibiotic":
      return "#3b82f6"; // blue
    case "vitamin":
      return "#22c55e"; // green
    case "allergy":
      return "#a855f7"; // purple
    case "heart":
      return "#ec4899"; // pink
    case "diabetes":
      return "#f97316"; // orange
    default:
      return "#6b7280"; // gray
  }
}

// Helper function to get category name
function getCategoryName(categoryId: string): string {
  const category = categories.find((c) => c.id === categoryId);
  return category ? category.label : "Other";
}

// Helper function to format date
function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export default StockTracker;
