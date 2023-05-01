<script setup lang="ts">
import { Auth } from 'aws-amplify'
import { useMutation, useQuery } from '@tanstack/vue-query'

const session = await Auth.currentSession()
const userToken = session.getIdToken().getJwtToken()

const { data: filesNames, refetch: refetchFiles } = useQuery(['get-csv'], () => {
  return fetch('https://d4yjhv4zz5.execute-api.us-east-2.amazonaws.com/default/csv', {
    headers: {
      Authorization: `Bearer ${userToken}`
    }
  }).then((response) => response.json())
})

const {
  mutateAsync: uploadFile,
  isLoading: isUploading,
  failureReason: uploadFilefailureReason
} = useMutation<unknown, { message: 'Unauthorized' }, FormData>(async (formData: FormData) => {
  const response = await fetch(
    'https://d4yjhv4zz5.execute-api.us-east-2.amazonaws.com/default/csv',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`
      },
      body: formData
    }
  )

  if (response.status === 401) {
    throw new Error('Unauthorized')
  }
})

const { mutateAsync: downloadFile, isLoading: isDownloading } = useMutation(
  async ({ fileName, asJson }: { fileName: string; asJson?: boolean }) => {
    const api = new URL(
      `https://d4yjhv4zz5.execute-api.us-east-2.amazonaws.com/default/csv/${fileName}`
    )

    if (asJson) {
      api.searchParams.set('format', 'json')
    }

    const response = await fetch(api, {
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    })
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    // TODO: get file name from response headers
    a.download = fileName
    a.click()
    a.remove()
  }
)

const {
  mutateAsync: deleteFile,
  isLoading: isDeleting,
  failureReason: deleteFilefailureReason
} = useMutation<unknown, { message: 'Unauthorized' }, string>(async (fileName: string) => {
  const response = await fetch(
    `https://d4yjhv4zz5.execute-api.us-east-2.amazonaws.com/default/csv/${fileName}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    }
  )

  if (response.status === 401) {
    throw new Error('Unauthorized')
  }
})

async function handleFileUpload(event: Event) {
  const targetEl = event.target as HTMLInputElement
  const file = targetEl.files?.[0]!
  const formData = new FormData()
  formData.append('csv', file)

  await uploadFile(formData)
  await refetchFiles()

  targetEl.value = ''
}

async function handleDeleteFile(fileName: string) {
  await deleteFile(fileName)
  await refetchFiles()
}
</script>

<template>
  <input
    type="file"
    className="file-input file-input-sm mb-4"
    :onChange="handleFileUpload"
    :disabled="isUploading"
  />
  <h1 v-if="isUploading">Uploading file...</h1>
  <h1 v-if="isDownloading">Downloading file...</h1>
  <h1 v-if="isDeleting">Deleting file...</h1>
  <h1
    v-if="
      uploadFilefailureReason?.message === 'Unauthorized' ||
      deleteFilefailureReason?.message === 'Unauthorized'
    "
    className="text-error"
  >
    You are not authorized to perform this action.
  </h1>
  <table v-if="filesNames?.length" className="table w-full">
    <thead>
      <tr>
        <th>Name</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="file in filesNames">
        <th :key="file">
          {{ file }}
        </th>
        <td>
          <div className="btn-group">
            <button
              className="btn btn-xs btn-success"
              :onClick="() => downloadFile({ fileName: file })"
              :disabled="isDownloading"
            >
              Download
            </button>
            <button
              className="btn btn-xs btn-warning"
              :onClick="() => downloadFile({ fileName: file, asJson: true })"
              :disabled="isDownloading"
            >
              Download as JSON
            </button>
            <button
              className="btn btn-xs btn-error"
              :onClick="() => handleDeleteFile(file)"
              :disabled="isDeleting"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  <div v-else-if="filesNames?.length === 0">No files uploaded yet.</div>
  <h1 v-else>Loading...</h1>
</template>
