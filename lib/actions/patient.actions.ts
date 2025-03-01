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
 } from "../appwrite.config";
import { parseStringify } from "../utils";
import {InputFile} from 'node-appwrite/file'


export const createUser = async (user: CreateUserParams) => {
   try {
     // Create new user -> https://appwrite.io/docs/references/1.5.x/server-nodejs/users#create
     console.log('user-> ',user)
     const newuser = await users.create(
       ID.unique(),
       user.email,
       user.phone,
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

export const registerPatient = async ({identificationDocument, ...patient} : RegisterUserParams) => {
  try {
    let file;

    if(identificationDocument) { // if there is a file
      const inputFile = InputFile.fromBuffer( //to create a blob from the file
        identificationDocument?.get('blobFile') as Blob,
        identificationDocument?.get('fileName') as string,
      )

      file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile) //upload the file
    }

    console.log( {
        identificationDocumentId: file?.$id || null,
        identificationDocumentUrl: `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file?.$id}/view?project=${DATABASE_ID}`,
    })

    const newPatient = await databases.createDocument(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      ID.unique(),
      {
        identificationDocumentId: file?.$id || null,
        identificationDocumentUrl: `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file?.$id}/view?project=${DATABASE_ID}`,
        ...patient
      }
    )

    return parseStringify(newPatient)


  } catch(error) {
    console.log('error:', error)
  }
}
