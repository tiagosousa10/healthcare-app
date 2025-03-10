'use server'

import { ID,  Query } from "node-appwrite";
import {
  BUCKET_ID,
  DATABASE_ID,
  databases,
  ENDPOINT,
  PATIENT_COLLECTION_ID,
  storage,
   users,
   PROJECT_ID
 } from "../appwrite.config";
import { parseStringify } from "../utils";
import {InputFile} from 'node-appwrite'


export const createUser = async (user: CreateUserParams) => {
   try {
    const formattedPhone = `+${user.phone.replace(/\D+/g, '').slice(0, 15)}`;
     // Create new user -> https://appwrite.io/docs/references/1.5.x/server-nodejs/users#create
     console.log('user-> ',user)
     const newuser = await users.create(
       ID.unique(),
       user.email,
       formattedPhone,
       undefined,
       user.name
     );

     console.log('newuser',newuser)
 
     return parseStringify(newuser);
   } catch (error: any) { //eslint-disable-line
     // Check existing user
     if (error && error?.code === 409) {
       const existingUser = await users.list([
         Query.equal("email", [user.email]),
       ]);
 
       return existingUser.users[0];
     }
     console.error("An error occurred while creating a new user:", error);
   }
 };

export const getUser = async (userId:string) => {
  try {

    const user = await users.get(userId)

    return parseStringify(user)

  } catch(error) {
    console.log(error)
  }
} 

export const getPatient = async (userId:string) => {
  try {

    const patients = await databases.listDocuments( // list all documents 
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      [Query.equal('userId', userId)] // filter by userId
    )

    return parseStringify(patients.documents[0]) // return the first document

  } catch(error) {
    console.log(error)
  }
} 

// REGISTER PATIENT
export const registerPatient = async ({
  identificationDocument,
  ...patient
}: RegisterUserParams) => {
  try {
    // Upload file ->  // https://appwrite.io/docs/references/cloud/client-web/storage#createFile
    let file;
    if (identificationDocument) {
      const inputFile =
        identificationDocument &&
        InputFile.fromBlob(
          identificationDocument?.get("blobFile") as Blob,
          identificationDocument?.get("fileName") as string
        );

      file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile);
    }

    // Create new patient document -> https://appwrite.io/docs/references/cloud/server-nodejs/databases#createDocument
    const newPatient = await databases.createDocument(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      ID.unique(),
      {
        identificationDocumentId: file?.$id ? file.$id : null,
        identificationDocumentUrl: file?.$id
          ? `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view??project=${PROJECT_ID}`
          : null,
        ...patient,
      }
    );

    return parseStringify(newPatient);
  } catch (error) {
    console.error("An error occurred while creating a new patient:", error);
  }
};

