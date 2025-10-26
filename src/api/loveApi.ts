/**
 * Love API corrigido
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

export interface User {
  id?: number
  username: string
  email: string
  password_hash?: string
  created_at?: string
  updated_at?: string
}

export interface Folder {
  id: string
  name: string
  created_by: User
  cover_photo_code?: string | null
  created_at?: string
  updated_at?: string
  visible: boolean
}

export interface Photo {
  id: string
  code: string
  filename: string
  original_name: string
  uploaded_by?: User | null
  transferred_by?: User | null
  transfer_number?: number
  created_at?: string
}

export interface FolderPhoto {
  folderId: string
  photoId: string
}
export interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface PhotoDownload {
  photoId: string
  userId: string
  downloaded_at?: string
}
let baseURL = "https://framelove-api.goncalocgomes.pt/";
if (typeof window !== "undefined") {
  const url = window.location.host;
  if (url.includes(":5173")) {
    baseURL = `http://${window.location.hostname}:3000`;
  }
}

/**
 * Cria instância da API com ou sem token
 */
export const createLoveAPI = (token?: string) => {
  const api: AxiosInstance = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
  });

  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  // ----- USERS -----
  const usersControllerCreate = (data: User, options?: AxiosRequestConfig) => api.post(`/users`, data, options);
  const usersControllerFindAll = (options?: AxiosRequestConfig) => api.get(`/users`, options);
  const usersControllerFindOne = (id: string, options?: AxiosRequestConfig) => api.get(`/users/${id}`, options);
  const usersControllerUpdate = (id: string, data: Partial<User>, options?: AxiosRequestConfig) => api.put(`/users/${id}`, data, options);
  const usersControllerRemove = (id: string, options?: AxiosRequestConfig) => api.delete(`/users/${id}`, options);
  const updateUserPassword = (
    userId: string | number,
    dto: UpdatePasswordDto,
    options?: AxiosRequestConfig
  ) => {
    return api.patch(`/users/${userId}/password`, dto, options);
  };
  // ----- AUTH -----
  const authControllerLogin = (data: { email: string; password: string }, options?: AxiosRequestConfig) =>
    api.post<{ message: string; access_token: string; user: User }>(`/auth/login`, data, options);

  // ----- FOLDERS -----
  const foldersControllerFindAll = (options?: AxiosRequestConfig) => api.get<Folder[]>(`/folders`, options);
  const foldersControllerFindOne = (id: string, options?: AxiosRequestConfig) => api.get<Folder>(`/folders/${id}`, options);
  const foldersControllerCreate = (data: Folder, options?: AxiosRequestConfig) => api.post(`/folders`, data, options);
  const foldersControllerUpdate = (id: string, data: Partial<Folder>, options?: AxiosRequestConfig) => api.put(`/folders/${id}`, data, options);
  const foldersControllerRemove = (id: string, options?: AxiosRequestConfig) => api.delete(`/folders/${id}`, options);
  const foldersControllerUploadCover = (
    folderId: string,
    file: File,
    options?: AxiosRequestConfig
  ) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post(`/folders/${folderId}/upload-cover`, formData, {
      ...options,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(options?.headers || {}),
      },
    });
  };
  const foldersControllerGetCover = (code: string, options?: AxiosRequestConfig) =>
    api.get(`/folders/cover/${code}`, {
      ...options,
      responseType: 'blob', // necessário para imagens
    });
  // ----- PHOTOS -----

  const photosControllerFindAll = (options?: AxiosRequestConfig) => api.get<Photo[]>(`/photos`, options);
  const photosControllerFindOne = (id: string, options?: AxiosRequestConfig) => api.get<Photo>(`/photos/${id}`, options);
  const photosControllerFindNoFolder = (id: string, options?: AxiosRequestConfig) => api.get<Photo[]>(`/photos/noFolder`, options);
  const photosControllerCreate = (data: Photo, options?: AxiosRequestConfig) => api.post(`/photos`, data, options);
  const photosControllerUpdate = (id: string, data: Partial<Photo>, options?: AxiosRequestConfig) => api.put(`/photos/${id}`, data, options);
  const photosControllerRemove = (id: string, options?: AxiosRequestConfig) => api.delete(`/photos/${id}`, options);

  const photosControllerUpload = (formData: FormData, options?: AxiosRequestConfig) =>
    api.post(`/photos/upload`, formData, {
      ...options,
      headers: {
        ...(options?.headers || {}),
        "Content-Type": "multipart/form-data",
      },
    });
  const getPhotoURL = (photoCode: string) => `${baseURL}/photos/image/${photoCode}`;

  const photosControllerGetDetails = (photoId: string, options?: AxiosRequestConfig) =>
    api.get(`/photos/details/${photoId}`, options);

  const folderPhotosControllerFindByFolder = (folderId: string, options?: AxiosRequestConfig) =>
    api.get<Photo[]>(`/folder-photos/${folderId}`, options);

  const folderPhotosControllerAddPhoto = (folderId: string, data: Partial<Photo>, options?: AxiosRequestConfig) =>
    api.post<Photo>(`/folder-photos/${folderId}`, data, options);

  const folderPhotosControllerRemovePhoto = (folderId: string, photoId: string, options?: AxiosRequestConfig) =>
    api.delete(`/folder-photos/${folderId}/${photoId}`, options);


  // Registar um download
  const photoDownloadsControllerRecord = (
    photoId: string,
    userId: string,
    options?: AxiosRequestConfig
  ) =>
    api.post<PhotoDownload>(
      `/photo-downloads/${photoId}/${userId}`,
      {},
      options
    );

  // Remover um registo de download
  const photoDownloadsControllerRemove = (
    photoId: string,
    userId: string,
    options?: AxiosRequestConfig
  ) =>
    api.delete(`/photo-downloads/${photoId}/${userId}`, options);

  // Obter todos os downloads de uma foto específica
  const photoDownloadsControllerFindByPhoto = (
    photoId: string,
    options?: AxiosRequestConfig
  ) =>
    api.get<PhotoDownload[]>(`/photo-downloads/photo/${photoId}`, options);

  // Obter todos os downloads feitos por um utilizador específico
  const photoDownloadsControllerFindByUser = (
    userId: string,
    options?: AxiosRequestConfig
  ) =>
    api.get<PhotoDownload[]>(`/photo-downloads/user/${userId}`, options);


  // Retorno
  return {
    api,
    // Users
    usersControllerCreate,
    usersControllerFindAll,
    usersControllerFindOne,
    usersControllerUpdate,
    usersControllerRemove,
    updateUserPassword,
    // Auth
    authControllerLogin,
    // Folders
    foldersControllerFindAll,
    foldersControllerFindOne,
    foldersControllerCreate,
    foldersControllerUpdate,
    foldersControllerRemove,
    foldersControllerUploadCover,
    foldersControllerGetCover,
    // Photos
    photosControllerFindAll,
    photosControllerFindOne,
    photosControllerFindNoFolder,
    photosControllerCreate,
    photosControllerUpdate,
    photosControllerRemove,
    photosControllerUpload,
    getPhotoURL,
    photosControllerGetDetails,

    photoDownloadsControllerFindByUser,
    photoDownloadsControllerFindByPhoto,
    photoDownloadsControllerRemove,
    photoDownloadsControllerRecord,

    folderPhotosControllerFindByFolder,
    folderPhotosControllerAddPhoto,
    folderPhotosControllerRemovePhoto
  };
};
