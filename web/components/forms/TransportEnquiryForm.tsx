"use client"

import { useState, useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Package, Calendar, Route, Plus, X } from "lucide-react"
import { Button, Input, Select, Card, CardHeader, CardTitle, CardContent, Modal } from "@/components/ui"

const formSchema = z.object({
  route_id: z.string().min(1, "Route is required"),
  cargoType: z.string().min(1, "Cargo type is required"),
  cargoWeight: z.string().min(1, "Cargo weight is required"),
  transportDate: z.string().min(1, "Transport date is required"),
  remarks: z.string().optional(),
})

const routeSchema = z.object({
  name: z.string().min(1, "Route name is required"),
  locations: z.array(z.object({
    stopType: z.enum(["load", "unload"]),
    remarks: z.string().optional(),
  })).min(2, "Route must have at least 2 locations (pickup and drop)"),
})

type FormSchema = z.infer<typeof formSchema>
type RouteSchema = z.infer<typeof routeSchema>

interface TransportRoute {
  id: number
  name: string
}

interface TransportEnquiryFormProps {
  onSubmit: (data: FormSchema) => Promise<void>
  onCancel?: () => void
  loading?: boolean
  submitText?: string
  cancelText?: string
  showHeader?: boolean
  className?: string
}

export default function TransportEnquiryForm({
  onSubmit,
  onCancel,
  loading = false,
  submitText = "Create Enquiry",
  cancelText = "Cancel",
  showHeader = true,
  className = ""
}: TransportEnquiryFormProps) {
  const [routes, setRoutes] = useState<TransportRoute[]>([])
  const [loadingRoutes, setLoadingRoutes] = useState(true)
  const [showRouteModal, setShowRouteModal] = useState(false)
  const [creatingRoute, setCreatingRoute] = useState(false)
  const [routeLocations, setRouteLocations] = useState([
    { stopType: "load" as const, remarks: "" },
    { stopType: "unload" as const, remarks: "" }
  ])
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormSchema>({
    resolver: zodResolver(formSchema)
  })

  const { register: registerRoute, handleSubmit: handleRouteSubmit, formState: { errors: routeErrors }, reset: resetRoute, setValue: setRouteValue } = useForm<RouteSchema>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      name: "",
      locations: routeLocations
    }
  })

  useEffect(() => {
    fetchRoutes()
  }, [])

  const fetchRoutes = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:3001/api/transport-routes`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setRoutes(data.routes || [])
      }
    } catch (error) {
      console.error("Error fetching routes:", error)
    } finally {
      setLoadingRoutes(false)
    }
  }

  const addLocation = () => {
    const newLocations = [...routeLocations, { stopType: "unload" as const, remarks: "" }]
    setRouteLocations(newLocations)
    setRouteValue("locations", newLocations)
  }

  const removeLocation = (index: number) => {
    if (routeLocations.length > 2) {
      const newLocations = routeLocations.filter((_, i) => i !== index)
      setRouteLocations(newLocations)
      setRouteValue("locations", newLocations)
    }
  }

  const updateLocation = (index: number, field: "stopType" | "remarks", value: string) => {
    const newLocations = [...routeLocations]
    newLocations[index] = { ...newLocations[index], [field]: value }
    setRouteLocations(newLocations)
    setRouteValue("locations", newLocations)
  }

  const createRoute = async (data: RouteSchema) => {
    setCreatingRoute(true)
    
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:3001/api/transport-routes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: data.name,
          locations: data.locations
        })
      })
      
      if (response.ok) {
        const newRoute = await response.json()
        setRoutes(prev => [...prev, newRoute])
        setValue("route_id", newRoute.id.toString())
        setShowRouteModal(false)
        resetRoute()
        setRouteLocations([
          { stopType: "load", remarks: "" },
          { stopType: "unload", remarks: "" }
        ])
      } else {
        const error = await response.json()
        alert(error.message || "Failed to create route")
      }
    } catch (error) {
      console.error("Error creating route:", error)
      alert("Failed to create route")
    } finally {
      setCreatingRoute(false)
    }
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  }

  const routeOptions = (routes || []).map(route => ({
    value: route.id.toString(),
    label: route.name
  }))

  return (
    <div className={`${className}`}>
      {showHeader && (
        <div className="mb-3">
          <h1 className="text-xl font-bold text-black">Create Transport Broker Rate Enquiry</h1>
        </div>
      )}

      <div className="bg-white rounded border border-gray-200 overflow-hidden">
        <div className="p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-3">
              {/* Route Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-black flex items-center">
                    <Route className="h-4 w-4 mr-1" />
                    Route Details
                  </h3>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowRouteModal(true)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New Route
                  </Button>
                </div>
                
                {loadingRoutes ? (
                  <div className="text-xs text-gray-500 py-4 text-center">Loading routes...</div>
                ) : (
                  <div className="space-y-2">
                    <Select
                      label="Transport Route"
                      placeholder="Select a route"
                      options={routeOptions}
                      error={errors.route_id?.message}
                      onSelectChange={register("route_id").onChange}
                      onBlur={register("route_id").onBlur}
                      name={register("route_id").name}
                      ref={register("route_id").ref}
                    />
                    <div className="text-xs text-gray-500">
                      Can't find your route? Click "New Route" to create one.
                    </div>
                  </div>
                )}
              </div>

              {/* Cargo Details */}
              <div className="space-y-2">
                <h3 className="text-base font-bold text-black flex items-center">
                  <Package className="h-4 w-4 mr-1" />
                  Cargo Details
                </h3>
                <div className="space-y-3">
                  <Input
                    label="Cargo Type"
                    placeholder="e.g., Electronics, Machinery, Textiles, Food Products"
                    error={errors.cargoType?.message}
                    helperText="Specify the type of goods being transported"
                    {...register("cargoType")}
                  />
                  
                  <Input
                    type="number"
                    label="Cargo Weight (MT)"
                    placeholder="Weight in metric tonnes"
                    error={errors.cargoWeight?.message}
                    min="0"
                    step="0.01"
                    helperText="Enter weight in metric tonnes (MT). 1 MT = 1000 kg"
                    {...register("cargoWeight")}
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              {/* Transport Details */}
              <div className="space-y-2">
                <h3 className="text-base font-bold text-black flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Transport Details
                </h3>
                <div className="space-y-3">
                  <Input
                    type="date"
                    label="Transport Date"
                    error={errors.transportDate?.message}
                    min={getMinDate()}
                    helperText="Select the date when transport is required"
                    {...register("transportDate")}
                  />
                  
                  <Input
                    label="Remarks"
                    placeholder="Any additional requirements, special handling instructions, or notes for brokers"
                    error={errors.remarks?.message}
                    helperText="Optional: Add any special requirements or instructions"
                    {...register("remarks")}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <h3 className="text-base font-bold text-black">Enquiry Summary</h3>
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>• This enquiry will be sent to transport brokers</div>
                    <div>• Brokers will submit their rate bids</div>
                    <div>• You can compare and select the best rates</div>
                    <div>• All communication will be tracked</div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="flex gap-2">
                      {onCancel && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={onCancel}
                        >
                          {cancelText}
                        </Button>
                      )}
                      <Button type="submit" disabled={loading} size="sm" className="flex-1 text-xs">
                        {loading ? "Creating..." : submitText}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Create Route Modal */}
      {showRouteModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded max-w-2xl w-full p-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-black">Create New Transport Route</h2>
              <button onClick={() => setShowRouteModal(false)} className="text-black hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRouteSubmit(createRoute)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-black mb-1">Route Name*</label>
                <input
                  type="text"
                  placeholder="e.g., Mumbai to Delhi, Bangalore to Chennai"
                  {...registerRoute("name")}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
                {routeErrors.name && <p className="text-red-500 text-xs mt-1">{routeErrors.name.message}</p>}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-black">Route Locations</h3>
                  <Button
                    type="button"
                    size="sm"
                    className="text-xs"
                    onClick={addLocation}
                  >
                    <Plus className="h-3 w-3" />
                    Add Location
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {routeLocations.map((location, index) => (
                    <div key={index} className="border border-gray-200 rounded p-2 bg-gray-50">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-black mb-1">Location {index + 1} Type</label>
                            <select
                              value={location.stopType}
                              onChange={(e) => updateLocation(index, "stopType", e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                            >
                              <option value="load">Loading Point</option>
                              <option value="unload">Unloading Point</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-black mb-1">Location Details</label>
                            <input
                              type="text"
                              placeholder="City, address, instructions"
                              value={location.remarks}
                              onChange={(e) => updateLocation(index, "remarks", e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                            />
                          </div>
                        </div>
                        {routeLocations.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeLocation(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded mt-5"
                            title="Remove location"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {routeErrors.locations && (
                  <p className="text-red-500 text-xs">{routeErrors.locations.message}</p>
                )}
                
                <div className="text-xs text-gray-500">
                  • Minimum 2 locations required (pickup and drop)
                </div>
              </div>
              
              <div className="flex gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setShowRouteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creatingRoute}
                  size="sm"
                  className="flex-1 text-xs"
                >
                  {creatingRoute ? "Creating..." : "Create Route"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}