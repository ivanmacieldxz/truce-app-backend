export class FriendDto {
  id: string; // Friendship ID
  friendId: string; // The ID of the friend user
  username: string; // The username of the friend
  createdAt: Date;
}

export class FriendshipRequestDto {
  id: string; // Friendship ID
  userId: string; // The ID of the other user
  username: string; // The username of the other user
  type: 'INCOMING' | 'OUTGOING';
  createdAt: Date;
}
