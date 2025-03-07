"use server"

import { ID, Query } from "node-appwrite";
import { APPOINTMENT_COLLECTION_ID, DATABASE_ID, databases, messaging } from "../appwrite.config";
import { formatDateTime, parseStringify } from "../utils";
import { Appointment } from "@/types/appwrite.types";
import { parse } from "path";
import { revalidatePath } from "next/cache";

export const createAppointment =  async(appointment: CreateAppointmentParams) => {
   try {
      const newAppointment = await databases.createDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      ID.unique(),
      appointment
      );

      return parseStringify(newAppointment)

   } catch(error) {

   }
}

export const getAppointment = async(appointmentId: string) => {
   try {
      const appointment = await databases.getDocument(
         DATABASE_ID!,
         APPOINTMENT_COLLECTION_ID!,
         appointmentId
      )

      return parseStringify(appointment)
   } catch(error){

   }
}

export const getRecentAppointmentList = async() => {
   try {
      const appointments = await databases.listDocuments(
         DATABASE_ID!,
         APPOINTMENT_COLLECTION_ID!,
         [Query.orderDesc("$createdAt")], // order by createdAt in descending order
      )

      const initialCounts = {
         scheduledCount: 0,
         pendingCount:0,
         cancelledCount: 0,
      }

      const counts = ( appointments.documents as Appointment[]).reduce((acc, appointment) => {
         if(appointment.status === "scheduled") {
            acc.scheduledCount += 1;
         } else if (appointment.status === "pending") {
            acc.pendingCount += 1;
         } else if (appointment.status === "cancelled") {
            acc.cancelledCount +=1;
         }

         return acc; // return the updated counts object
      },initialCounts)

      const data = {
         totalCount: appointments.total,
         ...counts, // scheduledCount, pendingCount, cancelledCount
         documents: appointments.documents
      }

      return parseStringify(data)


   } catch(error) {
      console.log(error)
   }
}

export const updateAppointment = async ({appointmentId, userId, appointment, type} : UpdateAppointmentParams) => {
   try {

      const updatedAppointment = await databases.updateDocument( 
         DATABASE_ID!,
         APPOINTMENT_COLLECTION_ID!,
         appointmentId,
         appointment // { status: "scheduled" }
      )

      if(!updateAppointment) {
         throw new Error('Failed to update appointment')
      }

      //SMS notification
      const smsMessage = `
      Hi, its Carepulse.
      ${type === 'schedule' 
         ? `Your appointment has been scheduled for ${formatDateTime(appointment.schedule!)}` 
         : `We regret to inform you that your appointment has been cancelled. Reason: ${appointment.cancellationReason}` 
      }`

      await sendSMSNotification(userId, smsMessage)

      revalidatePath('/admin') // revalidate the admin page
      return parseStringify(updatedAppointment)
      
   } catch(error) {
      console.log('updateAppointment error: ',error)
   }
}

export const sendSMSNotification = async (userId: string, content:string) => {
   try {
      const message = await messaging.createSms(ID.unique(), content, [], [userId])

      return parseStringify(message)
   } catch(error) {
     console.log(error) 
   }
}
