<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeUserMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly string $plainPassword,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Bienvenido — tus credenciales de acceso',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.welcome-user',
            with: [
                'nombre'       => $this->user->nombre,
                'email'        => $this->user->email,
                'password'     => $this->plainPassword,
                'loginUrl'     => env('FRONTEND_URL', 'http://localhost:3000') . '/auth/login',
                'tenantNombre' => $this->user->tenant?->nombre ?? '—',
            ],
        );
    }
}
