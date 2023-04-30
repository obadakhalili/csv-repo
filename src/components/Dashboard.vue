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
  }).then((res) => res.json())
})

const { mutateAsync: uploadFile, isLoading: isUploading } = useMutation((formData: FormData) => {
  return fetch('https://d4yjhv4zz5.execute-api.us-east-2.amazonaws.com/default/csv', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userToken}`
    },
    body: formData
  })
})

const { mutateAsync: downloadFile, isLoading: isDownloading } = useMutation(async (fileName: string) => {
  const response = await fetch(`https://d4yjhv4zz5.execute-api.us-east-2.amazonaws.com/default/csv/${fileName}`, {
    headers: {
      Authorization: `Bearer ${userToken}`
    }
  })
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  a.remove()
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
</script>

<template>
  <input type="file" className="file-input file-input-sm mb-4" :onChange="handleFileUpload" :disabled="isUploading" />
  <div v-if="isUploading">Uploading file...</div>
  <div v-else-if="isDownloading">Downloading file...</div>
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
          <button className="btn btn-xs btn-success" :onClick="() => downloadFile(file)" :disabled="isDownloading">Download</button>
        </td>
      </tr>
    </tbody>
  </table>
  <div v-else-if="filesNames?.length === 0">
    No files uploaded yet.
  </div>
  <div v-else>
    Loading...
  </div>
</template>
