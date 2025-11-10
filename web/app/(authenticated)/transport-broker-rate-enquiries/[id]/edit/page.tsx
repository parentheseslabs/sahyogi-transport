"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Package, Calendar, Route, Plus, X, MapPin } from "lucide-react"
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

interface TransportBrokerRateEnquiry {
  id: number
  routeId: number
  cargoType: string
  cargoWeight: number
  transportDate: string
  remarks?: string
  createdAt: string
  updatedAt: string
}

export default function EditTransportBrokerRateEnquiryPage() {
  const router = useRouter()
  const params = useParams()
  const enquiryId = parseInt(params.id as string)
  
  const [loading, setLoading] = useState(false)
  const [loadingEnquiry, setLoadingEnquiry] = useState(true)
  const [routes, setRoutes] = useState<TransportRoute[]>([])
  const [loadingRoutes, setLoadingRoutes] = useState(true)
  const [showRouteModal, setShowRouteModal] = useState(false)
  const [creatingRoute, setCreatingRoute] = useState(false)
  const [routeLocations, setRouteLocations] = useState([
    { stopType: "load" as const, remarks: "" },
    { stopType: "unload" as const, remarks: "" }
  ])
  
  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<FormSchema>({
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
    fetchEnquiry()
  }, [enquiryId])

  const fetchEnquiry = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transport-broker-rate-enquiries/${enquiryId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const enquiry: TransportBrokerRateEnquiry = await response.json()
        
        // Format the date for the input field
        const transportDate = new Date(enquiry.transportDate).toISOString().split('T')[0]
        
        reset({
          route_id: enquiry.routeId.toString(),
          cargoType: enquiry.cargoType,
          cargoWeight: enquiry.cargoWeight.toString(),
          transportDate: transportDate,
          remarks: enquiry.remarks || ""
        })
      } else {
        alert("Failed to fetch enquiry details")
        router.push("/transport-broker-rate-enquiries")
      }
    } catch (error) {
      console.error("Error fetching enquiry:", error)
      alert("Failed to fetch enquiry details")
      router.push("/transport-broker-rate-enquiries")
    } finally {
      setLoadingEnquiry(false)
    }
  }

  const fetchRoutes = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transport-routes`, {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transport-routes`, {
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
  
  const onSubmit = async (data: FormSchema) => {
    setLoading(true)
    
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transport-broker-rate-enquiries/${enquiryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          routeId: parseInt(data.route_id),
          cargoType: data.cargoType,
          cargoWeight: parseFloat(data.cargoWeight),
          transportDate: new Date(data.transportDate).toISOString(),
          remarks: data.remarks || ""
        })
      })
      
      if (response.ok) {
        router.push("/transport-broker-rate-enquiries")
      } else {
        const error = await response.json()
        alert(error.message || "Failed to update enquiry")
      }
    } catch (error) {
      console.error("Error updating enquiry:", error)
      alert("Failed to update enquiry")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this enquiry? This action cannot be undone.")) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transport-broker-rate-enquiries/${enquiryId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        router.push("/transport-broker-rate-enquiries")
      } else {
        const error = await response.json()
        alert(error.message || "Failed to delete enquiry")
      }
    } catch (error) {
      console.error("Error deleting enquiry:", error)
      alert("Failed to delete enquiry")
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

  if (loadingEnquiry) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-black">Loading enquiry details...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/transport-broker-rate-enquiries")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Enquiries
          </Button>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-semibold text-black">Edit Transport Broker Rate Enquiry</h1>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Delete Enquiry
            </Button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Route Selection */}
              <Card variant="bordered" className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg text-black">
                    <div className="flex items-center">
                      <Route className="h-5 w-5 mr-2" />
                      Route Details
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRouteModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      New Route
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingRoutes ? (
                    <div className="text-black py-8 text-center">Loading routes...</div>
                  ) : (
                    <div className="space-y-4">
                      <Select
                        label="Transport Route"
                        placeholder="Select a route"
                        options={routeOptions}
                        error={errors.route_id?.message}
                        {...register("route_id")}
                      />
                      <div className="text-xs text-black">
                        Can't find your route? Click "New Route" to create one.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cargo Details */}
              <Card variant="bordered">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-black">
                    <Package className="h-5 w-5 mr-2" />
                    Cargo Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Transport Details */}
              <Card variant="bordered">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-black">
                    <Calendar className="h-5 w-5 mr-2" />
                    Transport Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Input
                    type="date"
                    label="Transport Date"
                    error={errors.transportDate?.message}
                    min={getMinDate()}
                    helperText="Select the date when transport is required"
                    {...register("transportDate")}
                  />
                  
                  <div className="space-y-2">
                    <Input
                      label="Remarks"
                      placeholder="Any additional requirements, special handling instructions, or notes for brokers"
                      error={errors.remarks?.message}
                      helperText="Optional: Add any special requirements or instructions"
                      {...register("remarks")}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card variant="shadow">
                <CardHeader>
                  <CardTitle className="text-lg text-black">Update Enquiry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-black space-y-2">
                    <div className="text-black">• Changes will be saved immediately</div>
                    <div className="text-black">• Brokers will be notified of updates</div>
                    <div className="text-black">• Existing bids will remain valid</div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push("/transport-broker-rate-enquiries")}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading} className="flex-1">
                        {loading ? "Updating..." : "Update Enquiry"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        </div>
      </div>

      {/* Create Route Modal */}
      <Modal
        isOpen={showRouteModal}
        onClose={() => setShowRouteModal(false)}
        title="Create New Transport Route"
        size="lg"
      >
        <form onSubmit={handleRouteSubmit(createRoute)} className="space-y-6">
          <Input
            label="Route Name"
            placeholder="e.g., Mumbai to Delhi, Bangalore to Chennai"
            error={routeErrors.name?.message}
            helperText="Enter a descriptive name for the transport route"
            {...registerRoute("name")}
          />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-black">Route Locations</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLocation}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Location
              </Button>
            </div>
            
            <div className="space-y-3">
              {routeLocations.map((location, index) => (
                <Card key={index} variant="bordered" className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label={`Location ${index + 1} Type`}
                        value={location.stopType}
                        onChange={(value) => updateLocation(index, "stopType", value)}
                        options={[
                          { value: "load", label: "Loading Point" },
                          { value: "unload", label: "Unloading Point" }
                        ]}
                      />
                      <Input
                        label="Location Details"
                        placeholder="City, address, or specific instructions"
                        value={location.remarks}
                        onChange={(e) => updateLocation(index, "remarks", e.target.value)}
                      />
                    </div>
                    {routeLocations.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeLocation(index)}
                        className="mt-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
            
            {routeErrors.locations && (
              <p className="text-red-500 text-xs">{routeErrors.locations.message}</p>
            )}
            
            <div className="text-xs text-black">
              • Add multiple loading and unloading points for your route
              • Minimum 2 locations required (at least one pickup and one drop)
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRouteModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creatingRoute}>
              {creatingRoute ? "Creating..." : "Create Route"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}