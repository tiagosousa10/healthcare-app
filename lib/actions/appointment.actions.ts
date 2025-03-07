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

//  SEND SMS NOTIFICATION
export const sendSMSNotification = async (userId: string, content: string) => {
   try {
     // https://appwrite.io/docs/references/1.5.x/server-nodejs/messaging#createSms
     const message = await messaging.createSms(
       ID.unique(),
       content,
       [],
       [userId]
     );
     return parseStringify(message);
   } catch (error) {
     console.error("An error occurred while sending sms:", error);
   }
 };
 
 //  UPDATE APPOINTMENT
 export const updateAppointment = async ({
   appointmentId,
   userId,
   timeZone,
   appointment,
   type,
 }: UpdateAppointmentParams) => {
   try {
     // Update appointment to scheduled -> https://appwrite.io/docs/references/cloud/server-nodejs/databases#updateDocument
     const updatedAppointment = await databases.updateDocument(
       DATABASE_ID!,
       APPOINTMENT_COLLECTION_ID!,
       appointmentId,
       appointment
     );
 
     if (!updatedAppointment) throw Error;
 
     const smsMessage = 
      `Greetings from CarePulse. ${type === "schedule"
         ? `Your appointment is confirmed for ${formatDateTime(appointment.schedule!, timeZone).dateTime} with Dr. ${appointment.primaryPhysician}`
         : `We regret to inform that your appointment for ${formatDateTime(appointment.schedule!, timeZone).dateTime} is cancelled. Reason:  ${appointment.cancellationReason}`}.`;

     await sendSMSNotification(userId, smsMessage);
 
     revalidatePath("/admin");
     return parseStringify(updatedAppointment);
     
   } catch (error) {
     console.error("An error occurred while scheduling an appointment:", error);
   }
 };
