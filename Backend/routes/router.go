package routes

import (
	"net/http"
	"photovault/handlers"
	"photovault/middleware"
)

func SetupRoutes() *http.ServeMux {
	mux := http.NewServeMux()

	// Public routes with CORS
	mux.HandleFunc("/signup", middleware.WithCORS(handlers.SignupHandler))
	mux.HandleFunc("/signin", middleware.WithCORS(handlers.SigninHandler))
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("uploads"))))

	// Authenticated routes with CORS
	mux.HandleFunc("/upload/", middleware.WithCORS(middleware.AuthMiddleware(handlers.UploadHandler)))
	mux.HandleFunc("/cover/upload/", middleware.WithCORS(middleware.AuthMiddleware(handlers.CoverUploadHandler)))
	mux.HandleFunc("/images/trash/recover/", middleware.WithCORS(middleware.AuthMiddleware(handlers.TrashRecover)))
	mux.HandleFunc("/images/trash/delete/", middleware.WithCORS(middleware.AuthMiddleware(handlers.TrashDelete)))
	mux.HandleFunc("/images/trash/", middleware.WithCORS(middleware.AuthMiddleware(handlers.TrashHandler)))
	mux.HandleFunc("/images/", middleware.WithCORS(middleware.AuthMiddleware(handlers.ImagesHandler)))
	mux.HandleFunc("/api/addvaults", middleware.WithCORS(middleware.AuthMiddleware(handlers.AddVault)))
	mux.HandleFunc("/api/getvaults", middleware.WithCORS(middleware.AuthMiddleware(handlers.GetVaults)))
	mux.HandleFunc("/vault/delete/", middleware.WithCORS(middleware.AuthMiddleware(handlers.DeleteVault)))
	mux.HandleFunc("/api/update-order", middleware.WithCORS(middleware.AuthMiddleware(handlers.UpdateOrder)))
	mux.HandleFunc("/api/upload/trash/", middleware.WithCORS(middleware.AuthMiddleware(handlers.TrashUpload)))
	mux.HandleFunc("/time/set/", middleware.WithCORS(middleware.AuthMiddleware(handlers.SetVaultReleaseTimeHandler)))
	mux.HandleFunc("/time/get/", middleware.WithCORS(middleware.AuthMiddleware(handlers.GetVaultReleaseTimeHandler)))



	return mux
}

