terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The default GCP region for the Vertex AI endpoints"
  type        = string
  default     = "us-central1"
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Vertex AI Endpoint for Aura Embeddings
# This creates the endpoint template without activating it with a model
resource "google_vertex_ai_endpoint" "aura_embedding_endpoint" {
  display_name = "aura-embedding-endpoint"
  description  = "Vertex AI Endpoint for AURA embedding services"
  location     = var.region
}

# Vertex AI Endpoint for Aura Curation
# This creates the endpoint template without activating it with a model
resource "google_vertex_ai_endpoint" "aura_curation_endpoint" {
  display_name = "aura-curation-endpoint"
  description  = "Vertex AI Endpoint for AURA curation services"
  location     = var.region
}
