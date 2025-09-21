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
	mux.HandleFunc("/logout", middleware.WithCORS(handlers.LogoutHandler))
	mux.HandleFunc("/verify", middleware.WithCORS(handlers.VerifyEmailHandler))

	mux.HandleFunc("/user", middleware.WithCORS(handlers.UserHandler))

	mux.HandleFunc("/auth/refresh", middleware.WithCORS(handlers.RefreshHandler))
	mux.HandleFunc("/image/", middleware.WithCORS(middleware.AuthMiddleware(handlers.GetImageHandler)))
	mux.HandleFunc("/image/cover/", middleware.WithCORS(middleware.AuthMiddleware(handlers.GetCoverHandler)))

	// Authenticated routes with CORS
	mux.HandleFunc("/upload/", middleware.WithCORS(middleware.AuthMiddleware(handlers.UploadHandler)))
	mux.HandleFunc("/cover/upload/", middleware.WithCORS(middleware.AuthMiddleware(handlers.CoverUploadHandler)))
	mux.HandleFunc("/cover/display/", middleware.WithCORS(middleware.AuthMiddleware(handlers.CoverUploadHandler)))

	mux.HandleFunc("/images/trash/recover/", middleware.WithCORS(middleware.AuthMiddleware(handlers.TrashRecover)))
	mux.HandleFunc("/images/trash/delete/", middleware.WithCORS(middleware.AuthMiddleware(handlers.TrashDelete)))
	mux.HandleFunc("/images/trash/", middleware.WithCORS(middleware.AuthMiddleware(handlers.TrashHandler)))
	mux.HandleFunc("/images/", middleware.WithCORS(middleware.AuthMiddleware(handlers.ImagesHandler)))

	mux.HandleFunc("/api/addvaults", middleware.WithCORS(middleware.AuthMiddleware(handlers.AddVault)))
	mux.HandleFunc("/api/getvaults", middleware.WithCORS(middleware.AuthMiddleware(handlers.GetVaults)))
	mux.HandleFunc("/vault/delete/", middleware.WithCORS(middleware.AuthMiddleware(handlers.DeleteVault)))
	mux.HandleFunc("/vault/changeTitleAndDesc/", middleware.WithCORS(middleware.AuthMiddleware(handlers.TitleAndDescChange)))
	mux.HandleFunc("/vault/", middleware.WithCORS(middleware.AuthMiddleware(handlers.GetVaultByID)))
	mux.HandleFunc("/vault/changeStatus/", middleware.WithCORS(middleware.AuthMiddleware(handlers.ChangeCapsuleStatus)))

	mux.HandleFunc("/api/update-order", middleware.WithCORS(middleware.AuthMiddleware(handlers.UpdateOrder)))
	mux.HandleFunc("/api/upload/trash/", middleware.WithCORS(middleware.AuthMiddleware(handlers.TrashUpload)))

	mux.HandleFunc("/time/set/", middleware.WithCORS(middleware.AuthMiddleware(handlers.SetVaultReleaseTimeHandler)))
	mux.HandleFunc("/time/get/", middleware.WithCORS(middleware.AuthMiddleware(handlers.GetVaultReleaseTimeHandler)))

	mux.HandleFunc("/storage/upload/", middleware.WithCORS(handlers.UploadFile))

	mux.HandleFunc("/health", middleware.WithCORS(handlers.HealthHandler))

	return mux
}

