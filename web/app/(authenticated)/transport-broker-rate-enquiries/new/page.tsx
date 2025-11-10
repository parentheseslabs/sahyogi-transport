"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui"
import TransportEnquiryForm from "@/components/forms/TransportEnquiryForm"

export default function NewTransportBrokerRateEnquiryPage() {
  const router = useRouter()
  
  const handleSubmit = async (data: {
    route_id: string;
    cargoType: string;
    cargoWeight: string;
    transportDate: string;
    remarks?: string;
  }) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:3001/api/transport-broker-rate-enquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          route_id: parseInt(data.route_id),
          cargoType: data.cargoType,
          cargoWeight: parseFloat(data.cargoWeight),
          transportDate: new Date(data.transportDate).toISOString(),
          remarks: data.remarks || ""
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        router.push(`/transport-broker-rate-enquiries/${result.id}`)
      } else {
        const error = await response.json()
        alert(error.message || "Failed to create enquiry")
      }
    } catch (error) {
      console.error("Error creating enquiry:", error)
      alert("Failed to create enquiry")
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-black">Create Transport Broker Rate Enquiry</h1>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push("/transport-broker-rate-enquiries")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Enquiries
        </Button>
      </div>

      <TransportEnquiryForm
        onSubmit={handleSubmit}
        onCancel={() => router.push("/transport-broker-rate-enquiries")}
        loading={false}
        submitText="Create Enquiry"
        cancelText="Cancel"
        showHeader={false}
      />
    </div>
  )
}