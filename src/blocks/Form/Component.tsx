'use client'
import type { Form as FormType } from '@payloadcms/plugin-form-builder/types'

import { useRouter } from 'next/navigation'
import React, { useCallback, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { RichText } from '@/components/RichText'
import { Button } from '@/components/ui/button'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { buildInitialFormState } from './buildInitialFormState'
import { fields } from './fields'
import { getClientSideURL } from '@/utilities/getURL'
import { DefaultDocumentIDType } from 'payload'

export type Value = unknown

export interface Property {
  [key: string]: Value
}

export interface Data {
  [key: string]: Property | Property[]
}

export type FormBlockType = {
  blockName?: string
  blockType?: 'formBlock'
  className?: string
  enableIntro: boolean
  form: FormType
  introContent?: SerializedEditorState
}

export const FormBlock: React.FC<
  FormBlockType & {
    id?: DefaultDocumentIDType
  }
> = (props) => {
  const {
    className,
    enableIntro,
    form: formFromProps,
    form: { id: formID, confirmationMessage, confirmationType, redirect, submitButtonLabel } = {},
    introContent,
  } = props

  const formMethods = useForm({
    defaultValues: buildInitialFormState(formFromProps.fields),
  })
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = formMethods

  const [isLoading, setIsLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>()
  const [error, setError] = useState<{ message: string; status?: string } | undefined>()
  const router = useRouter()

  const onSubmit = useCallback(
    (data: Data) => {
      let loadingTimerID: ReturnType<typeof setTimeout>
      const submitForm = async () => {
        setError(undefined)

        // File inputs come back from react-hook-form as a FileList. Those must travel as
        // multipart file parts (matching the form-builder plugin's `handleUploads` hook, which
        // reads them off `req.files[fieldName]`) — everything else stays in the JSON payload.
        const fileEntries = Object.entries(data).filter(
          ([, value]) => typeof FileList !== 'undefined' && value instanceof FileList && value.length > 0,
        ) as unknown as [string, FileList][]

        const dataToSend = Object.entries(data)
          .filter(([name]) => !fileEntries.some(([fileName]) => fileName === name))
          .map(([name, value]) => ({
            field: name,
            value,
          }))

        // delay loading indicator by 1s
        loadingTimerID = setTimeout(() => {
          setIsLoading(true)
        }, 1000)

        try {
          let req: Response

          if (fileEntries.length > 0) {
            const formData = new FormData()
            formData.append(
              '_payload',
              JSON.stringify({
                form: formID,
                submissionData: dataToSend,
              }),
            )
            for (const [name, fileList] of fileEntries) {
              for (const file of Array.from(fileList)) {
                formData.append(name, file)
              }
            }

            req = await fetch(`${getClientSideURL()}/api/form-submissions`, {
              body: formData,
              method: 'POST',
            })
          } else {
            req = await fetch(`${getClientSideURL()}/api/form-submissions`, {
              body: JSON.stringify({
                form: formID,
                submissionData: dataToSend,
              }),
              headers: {
                'Content-Type': 'application/json',
              },
              method: 'POST',
            })
          }

          const res = await req.json()

          clearTimeout(loadingTimerID)

          if (req.status >= 400) {
            setIsLoading(false)

            setError({
              message: res.errors?.[0]?.message || 'Internal Server Error',
              status: res.status,
            })

            return
          }

          setIsLoading(false)
          setHasSubmitted(true)

          if (confirmationType === 'redirect' && redirect) {
            const { url } = redirect

            const redirectUrl = url

            if (redirectUrl) router.push(redirectUrl)
          }
        } catch (err) {
          console.warn(err)
          setIsLoading(false)
          setError({
            message: 'Something went wrong.',
          })
        }
      }

      void submitForm()
    },
    [router, formID, redirect, confirmationType],
  )

  return (
    <div className={className ?? 'container lg:max-w-3xl'}>
      {enableIntro && introContent && !hasSubmitted && (
        <RichText className="mb-6" data={introContent} enableGutter={false} />
      )}
      <div className="border-border bg-card rounded-2xl border p-6 lg:p-8">
        <FormProvider {...formMethods}>
          {!isLoading && hasSubmitted && confirmationType === 'message' && (
            <RichText data={confirmationMessage} />
          )}
          {isLoading && !hasSubmitted && (
            <p className="text-muted-foreground text-sm">Loading, please wait...</p>
          )}
          {error && (
            <div className="border-error/20 bg-error/10 text-error mb-6 rounded-lg border px-4 py-3 text-sm">
              {`${error.status || '500'}: ${error.message || ''}`}
            </div>
          )}
          {!hasSubmitted && (
            <form id={formID} onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4 last:mb-0">
                {formFromProps &&
                  formFromProps.fields &&
                  formFromProps.fields?.map((field, index) => {
                    const Field: React.FC<any> | undefined =
                      fields?.[field.blockType as keyof typeof fields]

                    if (Field) {
                      return (
                        <div className="mb-6 last:mb-0" key={index}>
                          <Field
                            form={formFromProps}
                            {...field}
                            {...formMethods}
                            control={control}
                            errors={errors}
                            register={register}
                          />
                        </div>
                      )
                    }
                    return null
                  })}
              </div>

              <Button className="w-full sm:w-auto" form={formID} size="lg" type="submit" variant="default">
                {submitButtonLabel}
              </Button>
            </form>
          )}
        </FormProvider>
      </div>
    </div>
  )
}
