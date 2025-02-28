'use client'

  import React from 'react'
  import { Control } from 'react-hook-form'
  import Image from 'next/image'
  import { E164Number } from "libphonenumber-js/core";
  import PhoneInput from 'react-phone-input-2'
  import 'react-phone-input-2/lib/style.css'
  import DatePicker from "react-datepicker";
  import "react-datepicker/dist/react-datepicker.css";

  import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form"
  import { Input } from "@/components/ui/input"

  import { FormFieldType } from './forms/PatientForm'
import { Select, SelectContent, SelectTrigger, SelectValue } from './ui/select';



 interface CustomProps {
   control: Control<any>,
   fieldType: FormFieldType,
   name: string,
   label?: string,
   placeholder?: string
   iconSrc?: string,
   iconAlt?: string,
   disabled?:boolean,
   dateFormat?: string,
   showTimeSelect?: boolean,
   children?: React.ReactNode,
   renderSkeleton?: (field:any) => React.ReactNode; // Optional renderSkeleton prop
   
 }


 const RenderInput = ({ field, props }: { field: any, props: CustomProps }) => {

  const {fieldType, iconSrc, iconAlt, placeholder, showTimeSelect, dateFormat, renderSkeleton} = props;

  switch (props.fieldType) {
    //INPUT
    case FormFieldType.INPUT:
      return (
        <div className="flex rounded-md border border-dark-500 bg-dark-400">
          {props.iconSrc && (
            <Image
              src={props.iconSrc}
              height={24}
              width={24}
              alt={props.iconAlt || "icon"}
              className="ml-2"
            />
          )}
          <FormControl>
            <Input
              placeholder={props.placeholder}
              {...field}
              className="shad-input border-0"
            />
          </FormControl>
        </div>
      );
      //TEXTAREA
    case FormFieldType.TEXTAREA:
      return (
        <FormControl>
          <textarea
            placeholder={props.placeholder}
            {...field}
            className="shad-textArea"
            disabled={props.disabled}
          />
        </FormControl>
      );
      //phone-input
    case FormFieldType.PHONE_INPUT:
      return (
        <FormControl>
          <PhoneInput
            country="pt"
            placeholder={props.placeholder}
            value={field.value as E164Number | undefined}
            onChange={field.onChange}
            inputStyle={{
              width: "100%",
              height: "100%",
              border: "none",
              background: "transparent",
              fontSize: "14px",
              fontWeight: "500",
              color: "#fffff",
            }}
            inputClass="shad-input "
          />
          
        </FormControl>
      );
      //DATE PICKER
    case FormFieldType.DATE_PICKER:
      return(
        <div className='flex rounded-md border border-dark-500 bg-dark-400'>
          <Image 
            src={"/assets/icons/calendar.svg"}
            height={24}
            width={24}
            alt='calendar'
            className='ml-2'
          />
          <FormControl>
            <DatePicker 
              selected={field.value}
              onChange={(date) => field.onChange(date)}
              dateFormat={dateFormat ?? 'MM/dd/yyyy'}
              showTimeSelect={showTimeSelect ?? false}
              timeInputLabel='Time: '
              wrapperClassName='date-picker'
            />
          </FormControl>
        </div>
      )
    //SKELETON
    case FormFieldType.SKELETON:
      return (
        renderSkeleton ? renderSkeleton(field) : null
      ) 
      //SELECT 
    case FormFieldType.SELECT:
      return(
        <FormControl>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
          >
            <FormControl >
              <SelectTrigger className='shad-select-trigger'>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>

            </FormControl>

            <SelectContent className='shad-select-content'>
              {props.children}
            </SelectContent>

          </Select>
        </FormControl>
      )
    default:
      break;
  }
 }

 // ----- main component -----
 const CustomFormField = (props: CustomProps) => {
  const { control, name, label } = props;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex-1">
          {props.fieldType !== FormFieldType.CHECKBOX && label && (
            <FormLabel className="shad-input-label">{label}</FormLabel>
          )}
          <RenderInput field={field} props={props} />

          <FormMessage className="shad-error" />
        </FormItem>
      )}
    />
  );
};

export default CustomFormField;
